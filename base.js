class base {
    constructor(data) {
        this.data = data;
    }

    getAngle(i) {
        return (i / this.data.length) * Math.PI * 2;
    }

    getLength(value, maxLength, globalMax) {
    return (value / globalMax) * maxLength;
}
}