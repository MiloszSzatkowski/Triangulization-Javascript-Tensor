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

imgElement.onload =  function () {

  var image_width = imgElement.width
  var image_height = imgElement.height;

  let desired_width = 420; // must be divisible by 3 for tensor transformations
  let desired_height = Math.floor(desired_width / (image_width / image_height) / 3.0) * 3;

  const main_image = tf.browser.fromPixels(imgElement);
  const rgbTens3d = tf.slice3d(main_image, [0, 0, 0], [-1, -1, 3]) // strip alpha channel
  var smallImg =  tf.image.resizeBilinear(rgbTens3d, [desired_height, desired_width]); 

  //normalize array from uint8 (0-255 range) into float32 (0.0-1.0 range)

  smallImg = tf.cast(smallImg, 'int32');
  tf.browser.toPixels(smallImg, document.getElementById('canvasOutput_4'));

  // tf.image.cropAndResize(main_image, boxes, boxInd, cropSize, method ?, extrapolationValue ?)

  var blur_input = parseInt(document.getElementById('blur').value);

  let mat = cv.imread(imgElement);

  var resized = resize(mat, image_width, image_height, desired_width, true);
  var get_sizes = resize(mat, image_width, image_height, desired_width, false); //returns an array

  console.time('someFunction')

  let src = resized;
  let dst = new cv.Mat();
  cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);
  // You can try more different parameters
  cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);

  cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);

  // const a = tf.tensor2d([1, 1, 1, 1, 0, 1, 1, 1, 1 ], [3, 3]).tile([2, 2]).print();

  let tensor_width = parseInt(get_sizes[0]);
  let tensor_height = parseInt(get_sizes[1]);

  // const a = tf.tensor2d([1, 1, 1, 1, 0, 1, 1, 1, 1], [3, 3]).tile([tensor_width / 3, tensor_height / 3]).print();

  // console.log(dst);

  // tf.tensor1d([1, 2, 3]).print();

  // let bw = new cv.Mat();
  // let blured = new cv.Mat();
  let line_image = new cv.Mat();

  cv.Canny(dst, line_image, 50, 100, 3, true);

  cv.imshow('canvasOutput', resized);
  cv.imshow('canvasOutput_2', dst);
  cv.imshow('canvasOutput_3', line_image);

  console.timeEnd('someFunction')

  src.delete();
  // dst.delete();
  line_image.delete();

};

function onOpenCvReady() { }