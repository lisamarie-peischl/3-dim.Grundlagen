class base {
    constructor(data) {
        this.data = data;
        this.maxValue = Math.max(...data);
    }

    getAngle(i) {
        return (i / this.data.length) * Math.PI * 2;
    }

    getLength(value, maxLength) {
        return (value / this.maxValue) * maxLength;
    }
}