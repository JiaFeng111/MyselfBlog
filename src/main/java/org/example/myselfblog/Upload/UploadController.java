package org.example.myselfblog.Upload;

import org.example.myselfblog.common.response.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/upload")
public class UploadController {
    @Autowired
    private UploadService uploadService;
    @PostMapping("/image")
    public Result<String> uploadImage(
            @RequestParam("file") MultipartFile file,
            @SessionAttribute(name = "loginUserId", required = false) Long userId){
       String data= uploadService.uploadImage(file,userId);
       return new Result<>(true,"图片上传成功" ,data);
    }

}
