package org.example.myselfblog.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.user.request.CreateUserRequest;
import org.example.myselfblog.user.request.LoginRequest;
import org.example.myselfblog.user.request.UpdateUserRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.example.myselfblog.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class UserImpl implements UserService {

    @Autowired
    private UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public Long login(LoginRequest request) {
        if (request == null || request.getAccount() == null || request.getPassword() == null) {
            throw new BusinessException(400, "请填写账号和密码");
        }
        String account = request.getAccount().strip();
        String password = request.getPassword();
        if (account.isEmpty() || account.length() > 50 || password.isBlank() || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(400, "账号或密码格式不正确");
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getAccount, account);
        User user = userMapper.selectOne(wrapper);

        if (user == null || user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BusinessException(401, "账号或密码不正确");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(401, "账号或密码不正确");
        }
        return user.getId();
    }

    @Override
    public boolean addUser(CreateUserRequest request) {
        if (request == null || request.getAccount() == null
                || request.getPassword() == null
                || request.getName() == null || request.getSex() == null
                || request.getYear() == null) {
            throw new BusinessException(400, "注册资料不完整，请填写账号、密码、姓名、性别和年龄");
        }
        User user = new User();
        String account = request.getAccount().strip();
        if (account.isEmpty() || account.length() > 50) {
            throw new BusinessException(400, "账号长度必须为1到50个字符");
        } else {
            user.setAccount(account);
        }
        if (request.getName() != null) {
            String name = request.getName().strip();
            if (name.isEmpty() || name.length() > 20) {
                throw new BusinessException(400, "姓名长度必须为1到20个字符");
            }
            user.setName(name);
        }
        if (request.getSex() != null) {
            String sex = request.getSex().strip();
            if (sex.isEmpty() || sex.length() > 1) {
                throw new BusinessException(400, "性别不能为空且只能填写1个字符");
            }
            user.setSex(sex);
        }
        if (request.getYear() != null) {
            int year = request.getYear();
            if (year > 120 || year < 0) {
                throw new BusinessException(400, "年龄必须在0到120之间");
            }
            user.setYear(year);
        }
        String password = request.getPassword();
        if (password.isBlank() || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(400, "密码不能为空白，且UTF-8编码长度不能超过72字节");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        try {
            int rows = userMapper.insert(user);
            if (rows <= 0) {
                throw new BusinessException(500, "注册失败，请稍后重试");
            }
            return true;
        } catch (DuplicateKeyException e) {
            throw new BusinessException(409, "账号已存在");
        }
    }

    @Override
    public boolean updateUser(Long userId, UpdateUserRequest request) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (userId <= 0) {
            throw new BusinessException(400, "用户ID必须为正整数");
        }
        if (request == null) {
            throw new BusinessException(400, "修改资料不能为空");
        }
        if (request.getName() == null && request.getSex() == null
                && request.getYear() == null) {
            throw new BusinessException(400, "请至少填写一项需要修改的资料");
        }
        if (request.getName() != null) {
            String name = request.getName().strip();
            if (name.isEmpty() || name.length() > 20) {
                throw new BusinessException(400, "姓名长度必须为1到20个字符");
            }
            request.setName(name);
        }
        if (request.getSex() != null) {
            String sex = request.getSex().strip();
            if (sex.isEmpty() || sex.length() > 1) {
                throw new BusinessException(400, "性别不能为空且只能填写1个字符");
            }
            request.setSex(sex);
        }
        if (request.getYear() != null) {
            int year = request.getYear();
            if (year > 120 || year < 0) {
                throw new BusinessException(400, "年龄必须在0到120之间");
            }
            request.setYear(year);
        }
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(User::getId, userId);
        wrapper.set(request.getName() != null, User::getName, request.getName());
        wrapper.set(request.getSex() != null, User::getSex, request.getSex());
        wrapper.set(request.getYear() != null, User::getYear, request.getYear());
        int rows = userMapper.update(null, wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "用户不存在，无法更新资料");
        }
        return true;
    }
}
