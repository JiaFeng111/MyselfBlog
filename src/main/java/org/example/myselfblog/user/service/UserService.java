package org.example.myselfblog.user.service;

import org.example.myselfblog.user.request.CreateUserRequest;
import org.example.myselfblog.user.request.LoginRequest;
import org.example.myselfblog.user.request.UpdateUserRequest;

public interface UserService {
    Long login(LoginRequest request);

    boolean addUser(CreateUserRequest request);

    boolean updateUser(Long userId, UpdateUserRequest request);
}
