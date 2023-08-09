import { HttpStatusCode } from '*/utilities/constants'
import { JwtProvider } from '*/providers/JwtProvider'
import { env } from '*/config/environtment'


const isAuthorized = async (req, res, next) => {
    const clientAccessToken = req.cookies?.accessToken
    if (!clientAccessToken) {
        // Không tìm thấy token trong request
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ errors: 'Unauthorized (token not found).' })
    }

    try {
        //Xac thuc
        const decoded = await JwtProvider.verifyToken(env.ACCESS_TOKEN_SECRET_SIGNATURE, clientAccessToken)
        
        // Quan Trọng: Nếu token hợp lệ, lưu thông tin giải mã được vào đối tượng req, dùng cho các xử lý ở phía sau.
        req.jwtDecoded = decoded

        //tiếp tục cho phép request đi sang validation controller or service 
        next()
    } catch (error) {
        if (error?.message?.includes('jwt expired')) {
            // Check error là expired, chọn mã 410 nhiều
            return res.status(HttpStatusCode.EXPIRED).json({ errors: 'Need to refresh token.' })
        }
        // Trường hợp access_token không hợp lệ do bất kỳ lý do nào khác như sửa đổi hay sai lệch...vv thì trả về 401 cho client gọi api logout luôn.
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ errors: 'Unauthorized.' })
    }
}

export const AuthMiddleware = {
    isAuthorized
}