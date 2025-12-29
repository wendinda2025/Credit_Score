import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto, LogoutDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/auth.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur et retourne les tokens JWT'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'uuid-refresh-token',
          expiresIn: 900,
          user: {
            id: 'uuid',
            email: 'admin@microfinance.local',
            firstName: 'Admin',
            lastName: 'System',
            roles: ['ADMIN'],
            permissions: ['user:read', 'client:read'],
            branchId: 'uuid',
            branchName: 'Siège'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiResponse({ status: 403, description: 'Compte verrouillé ou désactivé' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Rafraîchir le token',
    description: 'Génère un nouveau token d\'accès à partir du refresh token'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Déconnexion',
    description: 'Révoque le refresh token de l\'utilisateur'
  })
  @ApiBody({ type: LogoutDto, required: false })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(
    @CurrentUser('sub') userId: string,
    @Body() logoutDto?: LogoutDto,
  ) {
    await this.authService.logout(userId, logoutDto?.refreshToken);
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Changer le mot de passe',
    description: 'Modifie le mot de passe de l\'utilisateur connecté'
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié avec succès' })
  @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, changePasswordDto);
    return { message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Profil utilisateur',
    description: 'Retourne les informations de l\'utilisateur connecté'
  })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      branchId: user.branchId,
    };
  }
}
