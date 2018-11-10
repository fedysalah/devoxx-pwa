import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class Swiper extends Component {

    static propTypes = {
        className: PropTypes.string,
        toLeft: PropTypes.func.isRequired,
        toRight: PropTypes.func.isRequired,
        toTop: PropTypes.func.isRequired,
        toBottom: PropTypes.func.isRequired,
    }

    static defaultProps = {
        className: '',
        toLeft: () => { },
        toRight: () => {},
        toTop: () => {},
        toBottom: () => {},
    }


    cancelSwipe = () => {
        this._touchStart = undefined;
        this._touchCurrent = undefined;
      }
    
    touchStart = (touchEvent) => {
    if (touchEvent.touches.length === 1) {
        this._touchStart = {
        x: touchEvent.targetTouches[0].clientX,
        y: touchEvent.targetTouches[0].clientY
        };
    } else {
        this._touchStart = undefined;
    }
    }

    touchMove = (touchEvent) => {
    if (touchEvent.preventDefault) {
        // touchEvent.preventDefault();
    }
    if (touchEvent.touches.length === 1) {
        this._touchCurrent = {
        x: touchEvent.targetTouches[0].clientX,
        y: touchEvent.targetTouches[0].clientY
        }
    } else {
        this._touchCurrent = undefined
    }

    }

    touchEnd = () => {
    if (this._touchStart && this._touchCurrent) {
        const deltaX = this._touchStart.x - this._touchCurrent.x;
        const deltaY = this._touchStart.y - this._touchCurrent.y;

        if (deltaX > 30 && Math.abs(deltaY) < 30) {
            this.props.toLeft();
        }
        if (deltaX < -30 && Math.abs(deltaY) < 30) {
            this.props.toRight();
        }
        if (deltaY > 30 && Math.abs(deltaX) < 30) {
            this.props.toTop();
        }
        if (deltaY < -30 && Math.abs(deltaX) < 30) {
            this.props.toBottom();
        }
        

    }
    this._touchStart = undefined;
    this._touchCurrent = undefined;
    }


    render() {
        return (
            <div
                className={this.props.className}
                onTouchStart={this.touchStart}
                onTouchEnd={this.touchEnd}
                onTouchMove={this.touchMove}
            >
                {this.props.children}
            </div>
        );
    }
}