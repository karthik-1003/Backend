const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }; //HigherOrder Function -> accepts function as param or can return a function

//EXAMPLE

// const test = (ad) => (a, b) => {
//     return ad(a,b);
// };

// const add = (a, b) => a + b; // Define `add`

// const res = test(add)(2, 3); // Calls the returned function with (2,3)
// console.log(res); // Output: 5
