package org.example.myselfblog.user.request;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String account;
    private String password;
    private String name;
    private String sex;
    private Integer year;
}
