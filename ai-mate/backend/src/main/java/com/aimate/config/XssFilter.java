package com.aimate.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import java.io.IOException;

/**
 * XSS 过滤器：对所有请求参数进行 HTML 转义，防止 XSS 攻击
 */
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
public class XssFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            chain.doFilter(new XssHttpServletRequestWrapper((HttpServletRequest) request), response);
        } else {
            chain.doFilter(request, response);
        }
    }

    @Override
    public void init(FilterConfig filterConfig) {
        log.info("XSS Filter initialized");
    }

    @Override
    public void destroy() {
        log.info("XSS Filter destroyed");
    }
}
