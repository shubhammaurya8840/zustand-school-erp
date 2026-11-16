import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import {
  CreateBookDto,
  UpdateBookDto,
  CreateBookCategoryDto,
  UpdateBookCategoryDto,
  IssueBookDto,
  ReturnBookDto,
} from './dto/create-book.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BookIssueStatus } from '@prisma/client';

@ApiTags('Library Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // ==========================================
  // Category Endpoints
  // ==========================================

  @Get('categories')
  @ApiOperation({ summary: 'List all book categories (active by default)' })
  async findAllCategories(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const shouldIncludeInactive = includeInactive === 'true' || includeInactive === '1';
    return this.libraryService.findAllCategories({
      search,
      includeInactive: shouldIncludeInactive,
    });
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get single book category' })
  async findOneCategory(@Param('id') id: string) {
    return this.libraryService.findOneCategory(id);
  }

  @Post('categories')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create new book category' })
  async createCategory(
    @Body() dto: CreateBookCategoryDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.createCategory(dto, actorUserId);
  }

  @Put('categories/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update book category name or description' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateBookCategoryDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.updateCategory(id, dto, actorUserId);
  }

  @Put('categories/:id/archive')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Toggle category active/archive status' })
  async archiveCategory(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.archiveCategory(id, actorUserId);
  }

  @Delete('categories/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete empty category (prevented if linked to books)' })
  async deleteCategory(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.deleteCategory(id, actorUserId);
  }

  // ==========================================
  // Books Catalogue Endpoints
  // ==========================================

  @Get('books')
  @ApiOperation({ summary: 'Catalogue search and availability across school library' })
  async findAllBooks(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.libraryService.findAllBooks({ search, category, categoryId, status, page, limit });
  }

  @Get('books/:id')
  @ApiOperation({ summary: 'Get single book details and active issue history' })
  async findOneBook(@Param('id') id: string) {
    return this.libraryService.findOneBook(id);
  }

  @Post('books')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Add new book title to library inventory (Admin, Librarian & Accountant)' })
  async createBook(
    @Body() dto: CreateBookDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.createBook(dto, actorUserId);
  }

  @Put('books/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Update book details in library inventory' })
  async updateBook(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.updateBook(id, dto, actorUserId);
  }

  @Delete('books/:id')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete or archive book title from catalogue' })
  async deleteBook(
    @Param('id') id: string,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.libraryService.deleteBook(id, actorUserId);
  }

  // ==========================================
  // Issue & Return Endpoints (Circulation Desk)
  // ==========================================

  @Post('issue')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Issue book copy to student or teacher (Librarian & Accountant)' })
  async issueBook(
    @Body() dto: IssueBookDto,
    @CurrentUser('id') librarianUserId: string,
  ) {
    return this.libraryService.issueBook(dto, librarianUserId);
  }

  @Put('return/:issueId')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Process book return and record overdue fine if any' })
  async returnBook(
    @Param('issueId') issueId: string,
    @Body() dto: ReturnBookDto,
    @CurrentUser('id') librarianUserId: string,
  ) {
    return this.libraryService.returnBook(issueId, dto, librarianUserId);
  }

  @Get('overdue')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get overdue loans list' })
  async getOverdueList(@Query('limit') limit?: number) {
    return this.libraryService.getOverdueList(limit ? Number(limit) : 20);
  }

  @Get('circulation')
  @Roles(Role.SCHOOL_ADMIN, Role.LIBRARIAN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get current circulation desk transactions and overdue status' })
  async getCirculationList(
    @Query('status') status?: BookIssueStatus,
    @Query('limit') limit?: number,
  ) {
    return this.libraryService.getCirculationList(status, limit ? Number(limit) : 20);
  }
}
