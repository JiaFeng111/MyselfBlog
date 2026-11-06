package org.example.myselfblog.user.controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.common.response.Result;
import org.example.myselfblog.user.request.CreateUserRequest;
import org.example.myselfblog.user.request.LoginRequest;
import org.example.myselfblog.user.request.UpdateUserRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.example.myselfblog.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserService userService;

    // 页面刷新后，从服务端 Session 恢复当前用户，前端不保存密码。
    @GetMapping("/me")
    public Result<User> currentUser(
            @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        User user = userId == null ? null : userMapper.selectById(userId);
        return new Result<>(true, user == null ? "当前未登录" : "当前用户查询成功", user);
    }

    @GetMapping("/{id}")
    public Result<User> getMessage(@SessionAttribute(name = "loginUserId", required = false) Long userId, @PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User loginUser = userMapper.selectById(userId);
        if (loginUser == null) {
            throw new BusinessException(401, "登录已失效，请重新登录");
        }
        if (!"1".equals(loginUser.getAccess())) {
            throw new BusinessException(403, "只有管理员可以查询用户资料");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "用户 ID 必须为正整数");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return new Result<>(true, "用户查询成功", user);
    }

    @PostMapping("/add")
    public Result<Void> addUser(@RequestBody CreateUserRequest request) {
        boolean success = userService.addUser(request);

        if (success) {
            return new Result<>(true, "注册成功", null);
        }
        throw new BusinessException(500, "注册失败，请稍后重试");
    }

    @PostMapping("/update")
    public Result<Void> updateUser(@SessionAttribute(name = "loginUserId", required = false) Long userId, @RequestBody UpdateUserRequest request) {
        boolean success = userService.updateUser(userId, request);
        if (!success) {
            throw new BusinessException(500, "资料修改失败，请稍后重试");
        }
        return new Result<>(true, "资料修改成功", null);
    }

    @PostMapping("/login")
    public Result<Void> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        Long userId = userService.login(loginRequest);
        if (userId == null) {
            throw new BusinessException(401, "账号或密码不正确");
        }
        HttpSession session = request.getSession();
        request.changeSessionId();
        session.setAttribute("loginUserId", userId);
        return new Result<>(true, "登录成功", null);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return new Result<>(true, "退出成功", null);
    }

}
