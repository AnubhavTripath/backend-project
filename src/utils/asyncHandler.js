const asyncHandler = (requestHandler) => {
    (req , res , next) => {
        Promise.resolve(requestHandler(req , res , next))
        .catch((error) => {
            next(error)
        })
    }
}


export {asyncHandler}


// const asyncHandler = (func) => {() => {}}
    // above is higher order function , means a function can take function in a parameter just like an variable

    // we can write it also like this
    // const asyncHandler = (func) => () => {}
        // just removed the outer brackets


// const asyncHandler = (func) => async(req , res , next) => {
//     try{
//         await func(req , res , next)
//     }catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }