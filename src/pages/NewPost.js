import React, { Component, Fragment } from 'react';
import { BackHeaderWithAction } from '../components/Header';
import '../styles/NewPost.css';
import { classSet, isOnDesktop, isOnMediumScreen } from '../utils/utils';
import { post } from '../stores/indexedDb';
import { UserContext } from '../context/user';
import moment from 'moment';
moment.locale('fr')

export class NewPost extends Component {

    state = {
        cameraDisabled: false,
        openCamera: false,
        imageSrc: undefined,
        imgValidated: false,
        mediaStream: undefined,
        location: undefined,
        text: ''
    }

    static contextType = UserContext;

    componentDidMount() {
        this._input.focus();
    }

    openCamera = (e) => {
        this._chooseFileSelected = false;
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(mediaStream => {
                this.setState({
                    openCamera: true,
                    mediaStream,
                    imageSrc: undefined,
                }, () => {
                    document.querySelector('video').srcObject = mediaStream;
                });
            })
            .catch(err => {
                this.setState({
                    openCamera: false,
                    cameraDisabled: true,
                    imageSrc: undefined,
                })
            })
    }

    closeCamera = (e) => {
        if (this.state.mediaStream) {
            this.state.mediaStream.getTracks()[0].stop();
        }
        this.setState({
            openCamera: false,
            mediaStream: undefined
        })
    }

    takePicture = (e) => {
        const canvas = document.querySelector('canvas');
        const video = document.querySelector('video');
        const ratio = video.width / video.height
        const height = canvas.width / ratio;
        canvas.height = height;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/png');
        this.state.mediaStream.getTracks()[0].stop();
        this.setState({
            imageSrc,
            openCamera: false,
            mediaStream: undefined,
        })
    }

    retry = (e) => {
        URL.revokeObjectURL(this.state.imageSrc);
        this.setState({
            imageSrc: undefined
        })
        if (this._chooseFileSelected) {
            this.openChooseFile();
        } else {
            this.openCamera();
        }

    }

    validate = (e) => {
        if (this._picURL) {
            URL.revokeObjectURL(this._picURL);
        }
        this.setState({
            imgValidated: true,
        })
    }

    picChange = (evt) => {
        const fileInput = evt.target.files;
        if (fileInput.length > 0) {
            this._picURL = URL.createObjectURL(fileInput[0]);
            const canvas = document.querySelector('canvas');
            const ctx = canvas.getContext('2d')
            const photo = new Image();
            photo.onload = () => {
                //draw photo into canvas when ready
                const ratio = photo.width / photo.height
                const height = canvas.width / ratio;
                canvas.height = height;
                ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
                const imageSrc = canvas.toDataURL('image/png');
                //this.state.mediaStream.getTracks()[0].stop();
                this.setState({
                    imageSrc,
                    openCamera: false,
                    mediaStream: undefined,
                    ratio,
                })
            };

            photo.src = this._picURL;
        }
    }

    openChooseFile = () => {
        this._chooseFileSelected = true
        document.querySelector('input[type=file]').click();
    }

    componentWillUnmount() {
        if (this.state.mediaStream) {
            this.state.mediaStream.getTracks()[0].stop();
        }
    }

    addPost = async () => {
        if (this.state.imageSrc && this.state.text) {
            const { location, text, imageSrc: picture } = this.state;
            let locationToSend = location ? { latitude: location.latitude, longitude: location.longitude } : undefined
            const newPost = {
                text,
                picture,
                date: moment().unix(),
                location: locationToSend,
                authorId: this.context.user.id
            }
            await post(newPost);
        }
    }

    setCurrentPostion = () => {
        navigator.geolocation.getCurrentPosition(pos => {
            this.setState({
                location: pos.coords
            })
        }, err => {
            console.warn(`ERROR(${err.code}): ${err.message}`);
        }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    onChangeText = (e) => {
        this.setState({
            text: e.target.value
        })
    }

    deletePicture = () => {
        this.setState({
            imageSrc: undefined,
            imgValidated: false,
        })
    }

    render() {
        let width = 280;
        let height = 210;
        if (isOnDesktop()) {
            width = 640;
            height = 480;
        } else if (isOnMediumScreen()) {
            width = 460;
            height = 345;
        }
        const takingPicture = this.state.openCamera || (this.state.imageSrc && !this.state.imgValidated)
        return (
            <div className="new-post-container">
                <BackHeaderWithAction hideAction={takingPicture} actionClass={classSet({"add-post": true, "disabled": !this.state.imageSrc || !this.state.text})} actionLabel={'Add new post'} doAction={this.addPost} />
                <div className="new-post-content">
                    {!takingPicture && (
                        <Fragment>
                            <textarea
                                ref={(elem) => this._input = elem}
                                value={this.state.description}
                                onChange={this.changeDescription}
                                onBlur={this.onKeyboardClose}
                                value={this.state.text}
                                onKeyDown={this.onKeyboardOpen}
                                onChange={this.onChangeText}
                                className="materialize-textarea post-text"
                                placeholder="A new beer wasted ?">
                            </textarea>
                            {this.state.imgValidated && this.state.imageSrc && (
                                <div className="pictures-validated-container">
                                    <img height={75} width={this.state.ratio ? Math.round(this.state.ratio * 75) : 100} src={this.state.imageSrc} />
                                    <i className="fa fa-times close material-icons delete-picture" onClick={this.deletePicture}></i>
                                </div>
                            )}
                            <div className="new-post-more">
                                {navigator.mediaDevices && (
                                    <button
                                        className="btn new-post-action camera"
                                        disabled={this.state.cameraDisabled || this.state.imgValidated}
                                        onClick={this.openCamera}>
                                        <i className="fa fa-camera material-icons medium"></i>
                                    </button>
                                )
                                }
                                <button className="btn new-post-action" disabled={this.state.imgValidated} onClick={this.openChooseFile}>
                                    <i className="fa fa-image material-icons medium"></i>
                                </button>
                                <button className="btn new-post-action" disabled={this.state.location} onClick={this.setCurrentPostion}>
                                    <i className="fa fa-map-marker material-icons medium"></i>
                                </button>
                            </div>
                        </Fragment>
                    )}
                    <input type="file" accept="image/*" onChange={this.picChange} />

                    <div className={classSet({ "picture-container": true, "hide": !(this.state.imageSrc && !this.state.imgValidated) })}>
                        <canvas width={width} height={height}></canvas>
                        <div className="buttons-actions">
                            <button className="btn btn-rounded" onClick={this.validate}>Validate</button>
                            <button className="btn btn-rounded" onClick={this.retry}>Retry</button>
                        </div>
                    </div>

                    {this.state.openCamera && this.state.mediaStream && (
                        <div className="video-container">
                            <video width={width} height={height} autoPlay></video>
                            <div className="buttons-actions">
                                <button className="btn btn-rounded" onClick={this.takePicture}>Take a picture</button>
                                <button className="btn btn-rounded" onClick={this.closeCamera}>Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}