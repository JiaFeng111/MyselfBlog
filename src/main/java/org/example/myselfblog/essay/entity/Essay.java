package org.example.myselfblog.essay.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("essay_message")
public class Essay {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private String essay;
    private String author;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private LocalDateTime publishTime;
    private Long categoryId;
    private String coverUrl;
    private String summary;
    @TableField("is_top")
    private Integer isTop;
    private Long viewCount;
    private Long likeCount;
}
