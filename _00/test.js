// const Delaunator = require('delaunator');

// console.log(jsfeat);

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
let imgCanvas = document.getElementById('canvasInput');
var input_context = imgCanvas.getContext("2d");
// input_context.getImageData(event.offsetX, event.offsetY, 1, 1).data;

var desired_width = 600; //the size after resizing the image

inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
  imgElement.style.display = "none";
}, false);


imgElement.onload =  async function () {

  //checking performance
  let timestamp = new Date().toString();
  console.time(timestamp);

  triangulate();

  console.timeEnd(timestamp);

};

document.getElementById('execute').addEventListener('click', (e) => {
  triangulate();
}, false);

function triangulate() {

    var image_width = imgElement.width
    var image_height = imgElement.height;

    let desired_height = Math.floor(desired_width / (image_width / image_height) / 3.0) * 3;

    input_context.canvas.width = desired_width;
    input_context.canvas.height = desired_height;
    input_context.drawImage(imgElement, 0, 0,desired_width,desired_height);

    var blur_input = parseInt(document.getElementById('blur').value);
    var cor_input = parseInt(document.getElementById('cor').value);
    var noise_input = parseInt(document.getElementById('noise').value);

    let mat = cv.imread(imgElement);

    var resized = resize(mat, image_width, image_height, desired_width, true);
    var get_sizes = resize(mat, image_width, image_height, desired_width, false); //returns an array

    let src = resized;
    let dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);

    cv.bilateralFilter(src, dst, 15, 40, 40, cv.BORDER_DEFAULT);

    cv.imshow(imgCanvas, dst);

    cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);

    let tensor_width = parseInt(get_sizes[0]);
    let tensor_height = parseInt(get_sizes[1]);

    let line_image = new cv.Mat();

    cv.Canny(dst, line_image, 50, 100, 3, true);

    var canny_array = [];

    function random_number(min,max) {
      return parseInt(Math.floor(Math.random() *
      (max - min + 1)) + min);
    }

    var corners;

    let canny_bool = true;
    let fast_bool = true;
    let provided_bool = false;

    if (canny_bool) {

      for(let x = 0; x < line_image.cols; x++){
       for(let y = 0; y < line_image.rows; y++){
         let index = (x + y * line_image.cols);
         let element = line_image.data[index];
         if (element !== 0) {
           if (index % cor_input == 0) {
             canny_array.push([x,y]);
           }
         }

         if (index % random_number(0,noise_input) == 0) {
           canny_array.push([x,y]);
         }
       }
     }

    } else if (fast_bool) {

      let fastThreshold = cor_input;
      tracking.Fast.THRESHOLD = fastThreshold;

      let imageData = input_context.getImageData(0, 0, desired_width, desired_height);

      let gray = tracking.Image.grayscale(imageData.data, desired_width, desired_height);
      corners = tracking.Fast.findCorners(gray, desired_width, desired_height);

      for (var i = 0; i < corners.length; i += 2) {
        canny_array.push ([corners[i], corners[i+1]]);
      }

    } else if (provided_bool) {

      let provided_points = [];


    }

    //add boundaries
    canny_array.push([0,0]);
    canny_array.push([0,line_image.cols]);
    canny_array.push([line_image.rows,0]);
    canny_array.push([line_image.rows,line_image.cols]);

    // console.log(canny_array);

    const delaunay = Delaunator.from(canny_array);
    var coordinates = [];
    var triangles = delaunay.triangles;

    var canvasElement = document.querySelector("#canvasOutput");
    var context = canvasElement.getContext("2d");
    context.canvas.width  = tensor_width;
    context.canvas.height = tensor_height;

    function center_triangle (arr) {
    	var centerX = (arr[0][0] + arr[1][0] + arr[2][0]) / 3;
    	var centerY = (arr[0][1] + arr[1][1] + arr[2][1]) / 3;
    	return [parseInt(centerX), parseInt(centerY)];
    }

    for (let i = 0; i < triangles.length; i += 3) {
      point_01 = canny_array[triangles[i]];
      point_02 = canny_array[triangles[i + 1]];
      point_03 = canny_array[triangles[i + 2]];

      let coord = [
          point_01,
          point_02,
          point_03
          ];

      coordinates.push(coord);

      //avarage of colours

      let center = center_triangle(coord);

      let offset = 2;

      let sample_point_01 = input_context.
        getImageData(center[0], center[1], 1, 1).data;

      let sample_point_02 = input_context.
        getImageData(center[0]+offset, center[1]+offset, 1, 1).data ;

      let sample_point_03 = input_context.
        getImageData(center[0]-offset, center[1]-offset, 1, 1).data;

      let avarage_r = parseInt((sample_point_01[0] + sample_point_02[0] + sample_point_03[0]) / 3);
      let avarage_g = parseInt((sample_point_01[1] + sample_point_02[1] + sample_point_03[1]) / 3);
      let avarage_b = parseInt((sample_point_01[2] + sample_point_02[2] + sample_point_03[2]) / 3);
      let avarage_a = parseInt((sample_point_01[3] + sample_point_02[3] + sample_point_03[3]) / 3);

      let sample_point = [avarage_r, avarage_g, avarage_b, avarage_a];
      // let sample_point = [255, 0, 0, 255];

      let colour = 'rgba(' + sample_point.toString() + ')';
      draw_triangle(context, coord, colour);
      if (i<10) {
        // console.log(center);
      }
    }


    function draw_triangle(context, arr, colour) {
      context.beginPath();
      context.moveTo(arr[0][0], arr[0][1]);
      context.lineTo(arr[1][0], arr[1][1]);
      context.lineTo(arr[2][0], arr[2][1]);
      context.closePath();
      context.lineWidth = 1;
      context.strokeStyle = colour;
      context.stroke();
      context.fillStyle = colour;
      context.fill();
    }

    // src.delete();
    // dst.delete();
    // line_image.delete();

}
