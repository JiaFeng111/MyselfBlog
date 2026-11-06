package org.example.myselfblog.Comment.eneity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("comment_message")
public class Comment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long essayId;
    private Long userId;
    private Integer status;
    private String content;
    private LocalDateTime createTime;
}
