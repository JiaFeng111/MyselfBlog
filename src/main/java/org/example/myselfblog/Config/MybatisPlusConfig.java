package org.example.myselfblog.Config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    @Bean
    public MybatisPlusInterceptor paginationInnerInterceptor() {

        PaginationInnerInterceptor paginationInnerInterceptor = new PaginationInnerInterceptor(DbType.MYSQL);

        paginationInnerInterceptor.setMaxLimit(50L);

        interceptor.addInnerInterceptor(paginationInnerInterceptor);

        return interceptor;

    }
}
