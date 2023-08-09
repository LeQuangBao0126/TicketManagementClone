import axios from "axios";
import { toast } from "react-toastify";
import { signOutUserAPI } from "redux/user/userSlice";
import { refreshTokenAPI } from "actions/ApiCall";

// How can I use the Redux store in non-component files?
// https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
// Inject store

let store;
export const injectStore = (_store) => {
  store = _store;
};
//export 1 hàm ra để ngoài kia gọi . gọi xong nó truyền vô

let authorizedAxiosInstance = axios.create();
// làm cho axios khi có cookie gán vào request gửi lên
authorizedAxiosInstance.defaults.withCredentials = true; // Make Axios send cookies in its requests automatically.

authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10;
// Kỹ thuật dùng javascript kết hợp css pointer-event để chặn user click nhanh tại bất kỳ chỗ nào có hành động click gọi api
// Đây là một kỹ thuật rất hay mà không phải dev nào cũng biết.
const updateSendingStatus = (sending = true) => {
  const submits = document.querySelectorAll(".tqd-send");
  for (let i = 0; i < submits.length; i++) {
    if (sending) submits[i].classList.add("tqd-waiting");
    else submits[i].classList.remove("tqd-waiting");
  }
};

authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    // măc định của axios 200 -> 299 ,
    // them mã điều hướng 302 nữa
    config.validateStatus = (status) => {
      return (status >= 200 && status < 300) || status === 302;
    };
    updateSendingStatus(true); // nhớ thêm class tqd-send vào button add card
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

authorizedAxiosInstance.interceptors.response.use(
  (response) => {
    // chuyển hướng url từ phía backend nếu cần
    if (response?.status === 302) {
      location.replace(response?.headers?.location);
    }
    updateSendingStatus(false);

    console.log(response.config.url.includes("sign_out"));
    return response;
  },
  (error) => {
    updateSendingStatus(false);

    //Nếu nhận mã 401 từ BE trả về => Xử lý gọi api signOut luôn
    if (error?.response?.status === 401) {
      // https://redux.js.org/faq/code-structure#how-can-i-use-the-redux-store-in-non-component-files
      // gọi dispatch mà dispatch chỉ dùng đc trong component thoi. còn này là file js
      store.dispatch(signOutUserAPI(false));
    }
    //Nếu nhận mã 410 và status message có thể là hết hạn token từ BE trả về => Xử lý refreshToken
    const originalRequest = error.config;
    if (error?.response?.status === 410 && !originalRequest._retry) {
      //phai lấy dc request gốc
      originalRequest._retry = true;
      return refreshTokenAPI()
        .then((data) => {
          //console.log('data after refresh token', data)
          return authorizedAxiosInstance(originalRequest);
        })
        .catch((error) => {
          //console.log(error)
          store.dispatch(signOutUserAPI(false));
        });
    }

    //show message lỗi khi BE trả về
    let errorMessage = error?.message;
    if (error?.response?.data?.errors) {
      errorMessage = error?.response?.data?.errors;
    }
    toast(errorMessage);
    return Promise.reject(error);
  }
);

export default authorizedAxiosInstance;
