package org.example.myselfblog.essay.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("essay_like")
public class EssayLike {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long essayId;
    private Long userId;
}
