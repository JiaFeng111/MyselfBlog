package org.example.myselfblog.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Result<T>{
    private boolean success;
    private String message;
    private T data;
}
