package org.example.myselfblog.user.request;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String sex;
    private Integer year;
}
