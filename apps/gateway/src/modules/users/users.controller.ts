import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs' })
  @ApiOkResponse({ description: 'Liste des utilisateurs' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par son ID' })
  @ApiParam({ name: 'id', description: "UUID de l'utilisateur" })
  @ApiOkResponse({ description: 'Utilisateur trouvé' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
