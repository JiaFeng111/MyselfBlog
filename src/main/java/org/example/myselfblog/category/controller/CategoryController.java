package org.example.myselfblog.category.controller;

import org.example.myselfblog.category.Service.CategoryService;
import org.example.myselfblog.category.entity.Category;
import org.example.myselfblog.category.request.CreateCategoryRequest;
import org.example.myselfblog.category.request.UpdateCategoryRequest;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.common.response.Result;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("category")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;
    @Autowired
    private UserMapper userMapper;

    @PostMapping("/add")
    public Result<Void> addCategory(@SessionAttribute(name = "loginUserId", required = false) Long userId, @RequestBody CreateCategoryRequest request) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = categoryService.addCategory(request, user);
        if (!success) {
            throw new BusinessException(500, "分类增加失败，请稍后重试");
        }
        return new Result<>(true, "成功创建分类！", null);
    }

    @GetMapping("/get")
    public Result<List<Category>> getCategories() {
        List<Category> categories = categoryService.listCategories();
        return new Result<>(true, "", categories);
    }
    @PostMapping("/update/{id}")
    public Result<Void> updateCategory(@SessionAttribute(name = "loginUserId", required = false) Long userId, @RequestBody UpdateCategoryRequest request, @PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = categoryService.updateCategory(id,request,user);
        if (!success) {
            throw new BusinessException(500, "分类名称修改失败，请稍后重试");
        }
        return new Result<>(true, "分类名称修改成功", null);

    }
    @PostMapping("/delect/{id}")
    public Result<Void> delectCategory(@SessionAttribute(name = "loginUserId", required = false) Long userId, @PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = categoryService.deleteCategory(id,user);
        if (!success) {
            throw new BusinessException(500, "分类删除失败，请稍后重试");
        }
        return new Result<>(true, "分类删除成功", null);
    }
}
