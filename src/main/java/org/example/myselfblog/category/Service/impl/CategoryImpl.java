package org.example.myselfblog.category.Service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.example.myselfblog.category.Service.CategoryService;
import org.example.myselfblog.category.entity.Category;
import org.example.myselfblog.category.mapper.CategoryMapper;
import org.example.myselfblog.category.request.CreateCategoryRequest;
import org.example.myselfblog.category.request.UpdateCategoryRequest;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryImpl implements CategoryService {
    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private EssayMapper essayMapper;

    @Override
    public boolean addCategory(CreateCategoryRequest request, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以创建分类");
        }
        if (request == null) {
            throw new BusinessException(400, "分类请求内容不能为空");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isBlank() || name.length() > 50) {
            throw new BusinessException(400, "分类名称不能为空，且不能超过50个字符");
        }
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Category::getName, name);
        Long count = categoryMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException(409, "分类名称已经存在");
        }
        Category category = new Category();
        category.setName(name);
        try {
            return categoryMapper.insert(category) > 0;
        } catch (DuplicateKeyException e) {
            throw new BusinessException(409, "分类名称已经存在");
        }
    }

    @Override
    public List<Category> listCategories() {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Category::getId);
        return categoryMapper.selectList(wrapper);
    }

    @Override
    public boolean updateCategory(Long id, UpdateCategoryRequest request, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以修改分类");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "分类ID必须为正整数");
        }
        if (request == null) {
            throw new BusinessException(400, "请求内容不能为空");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isBlank() || name.length() > 50) {
            throw new BusinessException(400, "分类名称不能为空白，名称不能超过50个字符");
        }
        Category existing = categoryMapper.selectById(id);

        if (existing == null) {
            throw new BusinessException(404, "分类不存在或已被删除");
        }
        if (name.equals(existing.getName())) {
            return true;
        }
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Category::getName, name).ne(Category::getId, id);
        Long count = categoryMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException(409, "分类名称已经存在");
        }
        Category category = new Category();
        category.setId(id);
        category.setName(name);
        try {
            int rows = categoryMapper.updateById(category);
            if (rows < 1) {
                throw new BusinessException(404, "分类不存在或已被删除");
            }
            return true;
        } catch (DuplicateKeyException e) {
            throw new BusinessException(409, "分类名称已经存在");
        }
    }

    @Override
    public boolean deleteCategory(Long id, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以删除文章");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Category existing = categoryMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "分类不存在或已被删除");
        }
        LambdaQueryWrapper<Essay> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Essay::getCategoryId, id);
        Long count = essayMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException(409, "该分类下存在文章，请先调整文章分类");
        }
        try {
            int rows = categoryMapper.deleteById(id);
            if (rows <= 0) throw new BusinessException(404, "分类不存在或已被删除");
            return true;
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException(409, "该分类仍被文章引用，无法删除");
        }
    }
}
