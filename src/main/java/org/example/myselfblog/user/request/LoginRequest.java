package org.example.myselfblog.user.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String account;
    private String password;
}
