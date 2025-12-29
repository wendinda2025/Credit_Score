import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles et permissions requis
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun rôle ni permission n'est requis, autoriser l'accès
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('Non authentifié');
    }

    // Vérifier les rôles
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) =>
        user.roles?.includes(role),
      );
      if (!hasRole) {
        throw new ForbiddenException(
          'Accès refusé. Rôle insuffisant.',
        );
      }
    }

    // Vérifier les permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((permission) =>
        user.permissions?.includes(permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException(
          'Accès refusé. Permission insuffisante.',
        );
      }
    }

    return true;
  }
}
