//checking performance
console.time('timeElapsed');
// const Delaunator = require('delaunator');

function resize(image, width, height, d_width, action) {

  if (image == null) { console.log('No image provided.'); return; }
  if (width == null || 0) { console.log('No width provided.'); return; }
  if (height == null || 0) { console.log('No height provided.'); return; }

  let inter = cv.INTER_AREA;
  let dim;

  let ratio = width / height;
  let d_height = d_width / ratio;

  //round height to the nearest number divisible by 3
  d_height = Math.floor(d_height / 3.0) * 3;

  let resized = new cv.Mat();

  let dsize = new cv.Size(d_width, d_height);


  if (action) {
    cv.resize(image, resized, dsize, 0, 0, cv.INTER_AREA);
    return resized;

  } else {
    return [d_width, d_height];
  }

}

let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');

inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
  imgElement.style.display = "none";
}, false);

imgElement.onload =  async function () {

  var image_width = imgElement.width
  var image_height = imgElement.height;

  let desired_width = 420; // must be divisible by 3 for tensor transformations
  let desired_height = Math.floor(desired_width / (image_width / image_height) / 3.0) * 3;

  var blur_input = parseInt(document.getElementById('blur').value);

  let mat = cv.imread(imgElement);

  var resized = resize(mat, image_width, image_height, desired_width, true);
  var get_sizes = resize(mat, image_width, image_height, desired_width, false); //returns an array

  let src = resized;
  let dst = new cv.Mat();
  cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);

  cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);

  cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);

  let tensor_width = parseInt(get_sizes[0]);
  let tensor_height = parseInt(get_sizes[1]);

  let line_image = new cv.Mat();

  cv.Canny(dst, line_image, 50, 100, 3, true);

  console.log(line_image.cols);
  console.log(line_image.rows);

  var canny_array = [];

   for(let x = 0; x < line_image.cols; x++){
    for(let y = 0; y < line_image.rows; y++){
      let index = (x + y * line_image.cols);
      let element = line_image.data[index];
      if (element !== 0) {
        if (index % 2 == 0) {
          canny_array.push([x,y]);
        }
      }
    }
  }

  //add boundaries
  canny_array.push([0,0]);
  canny_array.push([0,line_image.cols]);
  canny_array.push([line_image.rows,0]);
  canny_array.push([line_image.rows,line_image.cols]);


  const delaunay = Delaunator.from(canny_array);
  var coordinates = [];
  var triangles = delaunay.triangles;

  console.log(delaunay);
  console.log(triangles);

  var canvasElement = document.querySelector("#canvasOutput");
  var context = canvasElement.getContext("2d");
  context.canvas.width  = tensor_width;
  context.canvas.height = tensor_height;

  console.log(canvasElement);

  for (let i = 0; i < triangles.length; i += 3) {
    let coord = [
        canny_array[i],
        canny_array[i + 1],
        canny_array[i + 2]
        ];
    coordinates.push(coord);
    draw_triangle(context, coord);
    if (i===0) {
      console.log(coord);
    }
  }

  // console.log(coordinates);

  // cv.imshow('canvasOutput', resized);
  // cv.imshow('canvasOutput_2', dst);

  function draw_triangle(context, arr) {
    context.beginPath();
    context.moveTo(arr[0][0], arr[0][1]);
    context.lineTo(arr[1][0], arr[1][1]);
    context.lineTo(arr[2][0], arr[2][1]);
    context.closePath();
    context.lineWidth = 10;
    context.strokeStyle = '#666666';
    context.stroke();
    context.fillStyle = "#FFCC00";
    context.fill();
  }

  // src.delete();
  // dst.delete();
  // line_image.delete();

  //checking performance
  console.timeEnd('timeElapsed');

};
