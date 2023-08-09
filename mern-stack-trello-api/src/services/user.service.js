import { UserModel } from "*/models/user.model";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pick } from "lodash"; // pick những key value cần thiết by key
import { SendInBlueProvider } from "*/providers/SendInBlue.Provider";
import { WEBSITE_DOMAIN } from "*/utilities/constants";
import { JwtProvider } from "*/providers/JwtProvider";
import { CloudinaryProvider } from "*/providers/CloudinaryProvider";
import { env } from "*/config/environtment";
import { RedisQueueProvider } from "*/providers/RedisQueueProvider";
import { CardModel } from "*/models/card.model";

const createNew = async (data) => {
  try {
    const existUser = await UserModel.findOneByAny("email", data.email);
    if (existUser) {
      throw new Error("Email already exist.");
    }

    // Tạo data để lưu vào db
    const username = data.email.split("@")[0] || "";
    const user = {
      email: data.email,
      password: bcryptjs.hashSync(data.password, 3),
      username: username,
      displayName: username,
      verifyToken: uuidv4(),
    };
    const createdUser = await UserModel.createNew(user);
    const getUser = await UserModel.findOneByAny(
      "_id",
      createdUser.insertedId.toString()
    );

    //Send email
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getUser.email}&token=${getUser.verifyToken}`;
    const subject =
      "Trello Clone App: Please verify your email before using our services!";
    const htmlContent = `
      <h3>Here is your verification link:</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,<br/> - Trungquandev Official - </h3>
    `;
    await SendInBlueProvider.sendEMail(getUser.email, subject, htmlContent);

    // pick những key value cần thiết by key
    return pick(getUser, ["_id", "email", "username", "displayName", "role"]);
  } catch (error) {
    // console.log(error)
    throw new Error(error);
  }
};

const verifyAccount = async (data) => {
  try {
    const existUser = await UserModel.findOneByAny("email", data.email);

    if (!existUser) {
      throw new Error("Email not found .");
    }

    if (existUser.isActive) {
      throw new Error("Your account is already actived .");
    }

    if (data.token !== existUser.verifyToken) {
      throw new Error("Token is invalid");
    }

    const updatedUser = await UserModel.update(existUser._id.toString(), {
      verifyToken: null,
      isActive: true,
    });

    return pick(updatedUser, ["_id", "email", "username", "displayName"]);
  } catch (error) {
    throw new Error(error);
  }
};

const signIn = async (data) => {
  try {
    const existUser = await UserModel.findOneByAny("email", data.email);

    if (!existUser) {
      throw new Error("Email not found .");
    }

    if (!existUser.isActive) {
      throw new Error("Your account is not actived .");
    }

    //Compare password
    if (!bcryptjs.compareSync(data.password, existUser.password)) {
      throw new Error("Your email or password is incorrect");
    }

    // Xử lý jwt token
    const accessToken = await JwtProvider.generateToken(
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_SECRET_LIFE,
      { _id: existUser._id, email: existUser.email }
    );

    const refreshToken = await JwtProvider.generateToken(
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_SECRET_LIFE,
      { _id: existUser._id, email: existUser.email }
    );

    const resUser = pick(existUser, [
      "_id",
      "email",
      "username",
      "displayName",
      "role",
    ]);

    return { accessToken, refreshToken, ...resUser };
  } catch (error) {
    throw new Error(error);
  }
};

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      clientRefreshToken
    );
    // Xử lý jwt token
    const accessToken = await JwtProvider.generateToken(
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_SECRET_LIFE,
      { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email }
    );
    return { accessToken };
  } catch (error) {
    throw new Error(error);
  }
};

const update = async (userId, data, reqFile) => {
  try {
    let updatedUser = {};
    let shouldUpdateCardComments = false;

    if (reqFile) {
      // console.log(avatar)
      // console.log(avatar.buffer)

      const uploadResult = await CloudinaryProvider.streamUpload(
        reqFile.buffer,
        "avatars"
      ); //lỗi sẽ ra catch

      //  console.log(uploadResult)
      updatedUser = await UserModel.update(userId, {
        avatar: uploadResult.secure_url,
      });
      // neu ng ta cap nhật avatar thì cho cái này true trước
      shouldUpdateCardComments = true;
    } else if (data.currentPassword && data.newPassword) {
      //Xử lý thay đổi mật khẩu
      const existUser = await UserModel.findOneByAny("_id", userId);
      if (!existUser) {
        throw new Error("User not found .");
      }

      //Compare password
      if (!bcryptjs.compareSync(data.currentPassword, existUser.password)) {
        throw new Error("Password is incorrect");
      }

      updatedUser = await UserModel.update(userId, {
        password: bcryptjs.hashSync(data.newPassword, 3),
      });
    } else {
      //xử lý displayName hoặc các thông tin chung
      updatedUser = await UserModel.update(userId, data);
      if (data.displayName) {
        shouldUpdateCardComments = true; //nếu FE cập nhật displayName .thì cho cờ này true
      }
    }
    //xử lý việc cập nhật nhiều comment trong nhiều cards
    if (shouldUpdateCardComments) {
      //xử lý chạy background job
      // B1: Khởi tạo một hàng đợi để cập nhật toàn bộ comments của nhiều cards
      //const updateCardsCommentsQueue = RedisQueueProvider.generateQueue('updateCardsCommentsQueue')
      //B2 : khởi tạo những việc cần làm trong tiến trình hàng đợi - process queue
      // updateCardsCommentsQueue.process(async (job, done) => {
      //     console.log('Bắt đầu chạy một hoặc nhiều công việc - Job(s)...')
      //     setTimeout( async ()=>{
      //         try {
      //             const cardCommentsUpdated = await CardModel.updateManyComments(job.data)
      //             done(null, cardCommentsUpdated)
      //         } catch (error) {
      //             done(new Error('Error from updateCardsCommentsQueue', error))
      //         }
      //     } ,7000)
      // })
      // B3: Check completed hoặc failed, tùy trường hợp yêu cầu mà cần cái event này, để bắn thông báo khi job chạy xong chẳng hạn
      // Nhiều event khác: https://github.com/OptimalBits/bull/blob/HEAD/REFERENCE.md#events
      // updateCardsCommentsQueue.on('completed', (job, result) => {
      //     console.log(`Job with id: ${job.id} and name: ${job.queue.name} completed with result:`, result)
      // })
      // updateCardsCommentsQueue.on('failed', (job, error) => {
      //     console.log(`Job with id: ${job.id} and name: ${job.queue.name} failed with error:`, error)
      // })
      // // B4: Bước quan trọng cuối cùng: Thêm vào hàng đợi để redis xử lý
      // updateCardsCommentsQueue.add(updatedUser) // updatedUser chính là job.data ở bước 2
    }

    return pick(updatedUser, [
      "_id",
      "email",
      "username",
      "displayName",
      "role",
      "avatar",
    ]);
  } catch (error) {
    throw new Error(error);
  }
};

export const UserService = {
  createNew,
  verifyAccount,
  signIn,
  refreshToken,
  update,
};
