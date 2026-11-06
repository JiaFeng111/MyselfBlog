package org.example.myselfblog.Upload;

import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.UUID;


@Service

public class UploadImpl implements UploadService {
    @Autowired
    private UserMapper userMapper;
    @Value("${app.upload-dir}")
    private String uploadDir;

    @Override
    public String uploadImage(MultipartFile file, Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(401, "登陆失效");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以上传图片");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "文件请求内容不可以为空");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new BusinessException(413, "图片大小不能超过5MB");
        }
        String extension;
        try {
            extension = validateImage(file);
        } catch (IOException e) {
            throw new BusinessException(400, "图片无法读取或内容已损坏");
        }
        try {
            Path directory = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String filename = UUID.randomUUID().toString() + "." + extension;
            Path target = directory.resolve(filename);
            file.transferTo(target);
            return "/images/" + filename;
        } catch (IOException e) {
           throw  new BusinessException(500, "图片保存失败，请稍后重试");
        }
    }

    private String validateImage(MultipartFile file) throws IOException {
        try (InputStream existing = file.getInputStream();
             ImageInputStream imageInputStream = ImageIO.createImageInputStream(existing)) {
            if (imageInputStream == null) {
                throw new BusinessException(400, "无法识别图片");
            }
            Iterator<ImageReader> imageReaders = ImageIO.getImageReaders(imageInputStream);
            if (!imageReaders.hasNext()) {
                throw new BusinessException(400, "无法识别图片");
            }
            ImageReader reader = imageReaders.next();
            try {
                reader.setInput(imageInputStream);
                String formatName = reader.getFormatName();
                if (!"JPEG".equalsIgnoreCase(formatName) && !"PNG".equalsIgnoreCase(formatName)) {
                    throw new BusinessException(400, "只支持 JPEG、PNG 图片");
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0 || width > 5000 || height > 5000) {
                    throw new BusinessException(400, "图片宽高必须在1～5000像素之间");
                }
                reader.read(0); // 尝试解码，读取实际图片内容

                return "JPEG".equalsIgnoreCase(formatName) ? "jpg" : "png";
            } catch (IOException e) {
                throw new BusinessException(400, "图片无法读取或内容已损坏");
            } finally {
                reader.dispose(); // 释放图片读取器资源
            }
        }
    }
}
