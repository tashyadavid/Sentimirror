let moodSketch = (colorCode) => {
  return (p) => {
    let video,
      handpose,
      predictions = [];
    let formResolution = 15;
    let stepSize = 1.4;
    let baseRadius = 120;
    let radiusScale = 1;
    let centerX, centerY;
    let x = [],
      y = [];

    // Setup a transparent canvas to go on top of the mirror
    p.setup = () => {
      let canvas = p.createCanvas(p.windowWidth * 0.95, p.windowHeight * 0.75);
      canvas.parent("mood-sketch");

      p.clear();
      p.strokeWeight(1.4);
      p.noFill();

      video = p.createCapture(p.VIDEO);
      video.size(640, 480);
      video.hide();

      handpose = ml5.handpose(video, () => console.log("Handpose ready"));
      handpose.on("predict", (results) => (predictions = results));

      centerX = p.width / 2;
      centerY = p.height / 2;

      let angle = p.TWO_PI / formResolution;
      for (let i = 0; i < formResolution; i++) {
        x.push(p.cos(angle * i));
        y.push(p.sin(angle * i));
      }
    };

    p.draw = () => {
      let handPos = getHandPosition();
      let pinch = getPinchDistance();

      if (handPos) {
        centerX += (handPos.x - centerX) * 0.1;
        centerY += (handPos.y - centerY) * 0.1;
      }

      if (pinch !== null) {
        let newScale = p.map(pinch, 10, 200, 0.6, 2.2, true);
        radiusScale = p.lerp(radiusScale, newScale, 0.05);
      }

      for (let i = 0; i < formResolution; i++) {
        x[i] += p.random(-stepSize, stepSize) * 0.01;
        y[i] += p.random(-stepSize, stepSize) * 0.01;
      }

      p.stroke(colorCode[0], colorCode[1], colorCode[2], 180);
      p.strokeWeight(0.6);
      p.drawingContext.shadowBlur = 12;
      p.drawingContext.shadowColor = `rgba(${colorCode[0]}, ${colorCode[1]}, ${colorCode[2]}, 0.4)`;

      p.beginShape();
      p.curveVertex(
        x[formResolution - 1] * baseRadius * radiusScale + centerX,
        y[formResolution - 1] * baseRadius * radiusScale + centerY
      );
      for (let i = 0; i < formResolution; i++) {
        p.curveVertex(
          x[i] * baseRadius * radiusScale + centerX,
          y[i] * baseRadius * radiusScale + centerY
        );
      }
      p.curveVertex(
        x[0] * baseRadius * radiusScale + centerX,
        y[0] * baseRadius * radiusScale + centerY
      );
      p.curveVertex(
        x[1] * baseRadius * radiusScale + centerX,
        y[1] * baseRadius * radiusScale + centerY
      );
      p.endShape();
    };

    // Function to detect hand position for visuals
    function getHandPosition() {
      if (predictions.length > 0) {
        let palm = predictions[0].landmarks[9];
        let scaledX = p.map(palm[0], 0, video.width, 0, p.width);
        let scaledY = p.map(palm[1], 0, video.height, 0, p.height);
        return p.createVector(p.width - scaledX, scaledY); // mirror X
      }
      return null;
    }

    // Function to change visuals when users pinch the screen (less distance between fingers = smaller visuals and vice versa)
    function getPinchDistance() {
      if (predictions.length > 0) {
        let hand = predictions[0];
        let thumb = hand.landmarks[4];
        let index = hand.landmarks[8];
        if (thumb && index) {
          let tx = p.map(thumb[0], 0, video.width, 0, p.width);
          let ty = p.map(thumb[1], 0, video.height, 0, p.height);
          let ix = p.map(index[0], 0, video.width, 0, p.width);
          let iy = p.map(index[1], 0, video.height, 0, p.height);
          return p.dist(p.width - tx, ty, p.width - ix, iy);
        }
      }
      return null;
    }
  };
};
