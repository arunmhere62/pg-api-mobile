import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;

        // If data is already an ApiResponseDto, return it as is
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Wrap the data in ApiResponseDto
        return new ApiResponseDto(
          statusCode,
          'Success',
          data,
          undefined,
          request.url,
        );
      }),
    );
  }
}
