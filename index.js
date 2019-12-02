class Canvas {
    constructor (obj, options, controls = false) {
        const defaults = {
            width: 500,
            height: 500,
            background: '#cccccc',
            lineWeight: 1,
            lineColor: 'black'
        };

        this.height = defaults.height;
        this.width = defaults.width;
        this.background = defaults.background;

        this.lineWeight = defaults.lineWeight;
        this.lineColor = defaults.lineColor;

        this.mouseCoords = [0, 0];
        this.isMousedown = false;

        this.data = [];

        for (const option in options) {
            this[option] = defaults.hasOwnProperty(option) ? options[option] : this[option];
        }

        const canvas = obj.querySelector("canvas");

        console.log(obj.clientWidth)

        const resize = () => {
            canvas.width = obj.clientWidth <= canvas.width ? obj.clientWidth : canvas.width <= 500 ? obj.clientWidth : canvas.width;
            canvas.height = obj.clientHeight <= canvas.height ? obj.clientHeight : canvas.height <= 500 ? obj.clientHeight : canvas.height;
        };

        this.ctx = canvas.getContext('2d', {preserveDrawingBuffer: true});

        canvas.style.cursor = 'crosshair';

        // Set object options
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.background = this.background;
        window.onresize = () => resize();
        resize();

        if (controls) this.addControls(obj);

        // Events
        // DESKTOP
        canvas.addEventListener('mousedown', event => {
            const coords = [event.offsetX, event.offsetY];

            this.setCoords(coords);
            this.setMousedown(true);
        });

        canvas.addEventListener('mouseup', event => {
            const coords = [event.offsetX, event.offsetY];

            this.setCoords(coords);
            this.setMousedown(false);
            this.addDotToTape();
            this.ctx.beginPath();
            this.data.push('break')
        });

        canvas.addEventListener('mousemove', event => {
            if (!this.isMousedown) return;
            const coords = [event.offsetX, event.offsetY];

            this.setCoords(coords);
            this.addDotToTape();
        });

        canvas.addEventListener('mouseleave', () => {
            console.log('LEAVE!!!');
            this.setMousedown(false);
            this.ctx.beginPath();
        });

        // MOBILE
        canvas.addEventListener('touchstart', event => {
            const coords = [event.touches[0].clientX, event.touches[0].clientY];

            this.setCoords(coords);
            this.setMousedown(true);
        });
        canvas.addEventListener('touchend', event => {
            const coords = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];

            this.setCoords(coords);
            this.setMousedown(false);
            this.addDotToTape();
            this.ctx.beginPath();
            this.data.push('break')
        });
        canvas.addEventListener('touchmove', event => {
            if (!this.isMousedown) return;
            const coords = [event.touches[0].clientX, event.touches[0].clientY];

            this.setCoords(coords);
            this.addDotToTape();
        });
    }

    setMousedown (value = undefined) {
        this.isMousedown = value === undefined ? !this.isMousedown : value;
        console.log('setMousedown', this.isMousedown);
    }

    setCoords (value = undefined) {
        if (value !== undefined && !Array.isArray(value)) return console.error('setCoords', 'your value is not correct');
        this.mouseCoords = value === undefined ? [0, 0] : value;
        //console.log('setCoords: ', this.mouseCoords, Date.now());
    }

    setLineColor (value = undefined) {
        this.lineColor = value === undefined ? '#000000' : value;
        console.log('setLineColor: ', this.lineColor);
    }

    setLineWeight (value = undefined) {
        this.lineWeight = value === undefined ? this.lineWeight : value;
        console.log('setLineWeight: ', this.lineWeight);
    }

    setData (value = undefined) {
        this.data = value === undefined ? [] : value;
        console.log('setData');
    }

    addDotToTape (coords = undefined) {
        if (!this.isMousedown && !coords) return;
        if (!coords) this.data.push({coords: this.mouseCoords, time: Date.now()});

        let x, y;

        if (coords) {
            if (typeof coords === 'string') return this.ctx.beginPath();
            [x, y] = coords.coords
        } else {
            [x, y] =  this.mouseCoords;
        }

        console.log('x, y', x, y);

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = this.lineWeight;

        if (this.lineWeight > 1) {
            this.ctx.beginPath();
            this.ctx.fillStyle = this.lineColor;
            this.ctx.arc(x, y, this.lineWeight/2, 0, 100);
            this.ctx.fill();
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    clearArea () {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    addControls (obj) {
        const buttons = [
            {name: 'Clear', action: 'clear', element: 'button'},
            // {name: 'Save', action: 'save', element: 'button'},
            // {name: 'Play', action: 'play', element: 'button'},
            // {name: 'Download', action: 'download', element: 'a'},
            // {name: 'Change color', element: 'input', action: 'color'},
            // {name: 'weight', element: 'input', action: 'weight'}
        ];

        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.top = 0;
        controls.style.right = 0;

        buttons.map(btn => {
            const button = document.createElement(btn.element);
            button.innerText = btn.name;
            switch (btn.action) {
                case 'clear':
                    button.addEventListener('click', () => {
                        console.log('Cleared');
                        this.clearArea();
                        this.setData();
                        localStorage.clear();
                    });
                    break;
                case 'save':
                    button.addEventListener('click', () => {
                        console.log('Saved');
                        localStorage.setItem('data', JSON.stringify(this.data));
                        this.clearArea();
                        this.setData();
                    });
                    break;
                case 'play':
                    button.addEventListener('click', () => {
                        console.log('Played');
                        const data = JSON.parse(localStorage.getItem('data'));
                        console.log(data);
                        if (!data.length) return;

                        const dataObjcts = data.filter(e => e !== 'break');
                        const intervalTime = (dataObjcts[dataObjcts.length-1].time - dataObjcts[0].time) / data.length;

                        const interval = setInterval(() => {
                            if (!data.length) return clearInterval(interval);

                            const currentCoords = data.shift();
                            if (currentCoords === 'break') return this.ctx.beginPath();
                            this.addDotToTape(currentCoords);
                        }, intervalTime);
                        console.log(intervalTime);
                    });
                    break;
                case 'download':
                    button.addEventListener('click', e => {
                        const canvas = document.getElementById('canvas');
                        e.target.download = 'image.jpg';
                        e.target.href = canvas.toDataURL("image/jpg");
                    });
                    break;
                case 'color':
                    button.type = btn.action;
                    button.value = this.lineColor;
                    button.addEventListener('change', ({target}) => {
                        this.setLineColor(target.value);
                    });
                    break;
                case 'weight':
                    button.value = this.lineWeight;
                    button.addEventListener('change', ({target}) => {
                        this.setLineWeight(target.value);
                    });
                    break;
            }
            controls.append(button);
        });
        obj.append(controls);
    }
}
