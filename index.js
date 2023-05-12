const express = require('express');
const serveStatic = require('serve-static');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas');

//start express app
const app = express();

//create middleware to handle the serving the app
app.use(express.static(__dirname + '/public'));
//serve index by default
app.get('/increment', (req, res) => {
  // Read the current hit count from the counter.txt file
  const count = parseInt(fs.readFileSync('counter.txt'));

  // Increment the hit count and write it back to the counter.txt file
  const newCount = count + 1;
  fs.writeFileSync('counter.txt', newCount.toString());

  // Send a response to indicate that the hit count was incremented
  res.send('Hit count incremented');
});
//route for making the hit counter gif
app.get('/hit-counter', (req, res) => {
  // Read the current hit count from the counter.txt file
  const count_hit = parseInt(fs.readFileSync('counter.txt'));

  

  // Generate the hit counter GIF based on the hit count
  const digits = count_hit.toString().padStart(6, '0');
  //creating an array of digits
  const digitArray = digits.split('');
  //searching for the first non-zero digit
  const firstNonZeroIndex = digitArray.findIndex((digit) => digit !== '0');
  //console.log(firstNonZeroIndex);
  const Index = firstNonZeroIndex === -1 ? 5 : firstNonZeroIndex;

  // Calculate the canvas size based on the number of digits
  const digitWidth = 80;
  const digitHeight = 160;
  const canvasWidth = digitWidth * (digits.length - Index);
  const canvasHeight = digitHeight;

  // Create a GIF encoder and stream the response to the client
  const encoder = new GIFEncoder(canvasWidth, 160);
  encoder.createReadStream().pipe(res);
  encoder.start();
  encoder.setRepeat(0); // Set repeat to 0 to loop only once
  encoder.setDelay(100); // Set the delay between frames (adjust as needed)

  // Add the frames of the digit number GIFs to the GIF encoder
  // Load the individual digit GIFs and add them as frames to the GIF encoder
  Promise.all(
    digitArray.slice(Index).map((digit) => {
      const imgPath = `public/${digit}.gif`;
      return loadImage(imgPath);
    })
  )//images is an array of images
    .then((images) => {
      // Create a canvas to draw the GIF frames on
      const canvas = createCanvas(canvasWidth, canvasHeight);
      // Get the canvas context
        const context = canvas.getContext('2d');
        // Set the background color to off-white
        context.fillStyle = '#F8F8F8'; 
        // Replace with your desired off-white color

        // Fill the canvas with the background color
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the GIF frames on the canvas for the first time
      if (count_hit === 0) {
        // Load the 0.gif image and draw it on the canvas
        loadImage('public/0.gif').then((image) => {
          // Draw the image on the canvas
          context.drawImage(image, 0, 0, digitWidth, digitHeight);
          // Add the canvas as a frame to the GIF encoder
          encoder.addFrame(context);
          // Finish the GIF encoding and send the response
          encoder.finish();
        });
        // Draw the GIF frames on the canvas for the succesive times
      } else {
        //going through the images array and drawing each image on the canvas
        images.forEach((image, index) => {
          context.drawImage(image, index*digitWidth, 0,digitWidth,digitHeight);
        });
        encoder.addFrame(context);
        // Finish the GIF encoding and send the response
        encoder.finish();
      }

    })
    // Catch any errors that may occur
    .catch((error) => {
      console.error('Error loading GIF frames:', error);
    });

});
//start the server
app.listen(3000, () => {
  console.log('Hit counter app listening on port 3000!');
});
