package org.example.myselfblog.user.entity;


import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@TableName("usermessage")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String sex;
    private String access;
    private String account;
    @JsonIgnore
    private String passwordHash;
    private int year;
    @TableField("sign_time")
    private LocalDateTime signTime;
    @TableField("update_time")
    private LocalDateTime updateTime;


}
