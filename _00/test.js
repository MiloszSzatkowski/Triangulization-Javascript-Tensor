//checking performance
console.time('timeElapsed');

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

  console.log(line_image);
  console.log(line_image.data);
  console.log(line_image.data[200]);
  console.log(line_image.data.length);

  var canny_array = [];

   for(let x = 0; x < line_image.cols; x++){
    for(let y = 0; y < line_image.rows; y++){
      let index = (x + y * line_image.cols);
      let element = line_image.data[index];
      if (element !== 0) {
        if (index % 2 == 0) {
          canny_array.push([x,y].toString());
        }
      }
    }
  }

  console.log(canny_array);

  cv.imshow('canvasOutput', resized);
  cv.imshow('canvasOutput_2', dst);

  // src.delete();
  // dst.delete();
  // line_image.delete();

  //checking performance
  console.timeEnd('timeElapsed');

};
