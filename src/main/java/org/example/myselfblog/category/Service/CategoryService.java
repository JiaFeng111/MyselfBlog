package org.example.myselfblog.category.Service;


import org.example.myselfblog.category.entity.Category;
import org.example.myselfblog.category.request.CreateCategoryRequest;
import org.example.myselfblog.category.request.UpdateCategoryRequest;
import org.example.myselfblog.user.entity.User;

import java.util.List;

public interface CategoryService {
    boolean addCategory(CreateCategoryRequest request, User user);
    List<Category> listCategories();
    boolean updateCategory(Long id, UpdateCategoryRequest request, User user);
    boolean deleteCategory(Long id, User user);
}
