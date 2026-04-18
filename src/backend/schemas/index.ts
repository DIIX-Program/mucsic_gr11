import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email/Username không được để trống"),
    password: z.string().min(1, "Mật khẩu không được để trống"),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Tên đăng nhập ít nhất 3 ký tự").max(32),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải từ 6 ký tự"),
  }),
});

export const createPlaylistSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Tên danh sách phát không được để trống").max(100),
    cover_url: z.string().optional(),
  }),
});

export const addTrackSchema = z.object({
  body: z.object({
    trackId: z.string().min(1, "ID bài hát không hợp lệ"),
  }),
  params: z.object({
    id: z.string().min(1)
  })
});

export const commentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Nội dung bình luận không được để trống").max(1000),
  }),
});
