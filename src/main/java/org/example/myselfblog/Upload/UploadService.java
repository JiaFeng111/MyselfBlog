package org.example.myselfblog.Upload;

import org.springframework.web.multipart.MultipartFile;

public interface UploadService {
    String uploadImage(MultipartFile file,Long userId);
}
