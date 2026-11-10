package com.order.order.AOP;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;


@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    @Value("${aop.performance.threshold-ms:500}")
    private long thresholdMs;

    @Pointcut("within(@org.springframework.stereotype.Service *) "
            + "|| within(@org.springframework.stereotype.Repository *)")
    public void serviceAndRepo() {
    }

    @Around("serviceAndRepo()")
    public Object measureTime(ProceedingJoinPoint jp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = jp.proceed();
        long elapsed = System.currentTimeMillis() - start;

        String cls = jp.getTarget().getClass().getSimpleName();
        String method = jp.getSignature().getName();

        if (elapsed > thresholdMs) {
            log.warn("SLOW METHOD: {}.{}() took {}ms (threshold: {}ms)",
                    cls, method, elapsed, thresholdMs);
        } else if (elapsed > thresholdMs / 2) {
            log.info("{}.{}() took {}ms", cls, method, elapsed);
        }

        return result;
    }
}
