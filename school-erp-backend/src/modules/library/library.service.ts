import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateBookDto,
  UpdateBookDto,
  CreateBookCategoryDto,
  UpdateBookCategoryDto,
  IssueBookDto,
  ReturnBookDto,
} from './dto/create-book.dto';
import { BookIssueStatus } from '@prisma/client';

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ==========================================
  // Category Management
  // ==========================================

  async findAllCategories(query: { search?: string; includeInactive?: boolean }) {
    const where: any = {};

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.bookCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.bookCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { books: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Book category not found for ID "${id}"`);
    }

    return category;
  }

  async createCategory(dto: CreateBookCategoryDto, actorUserId: string) {
    const trimmedName = dto.name.trim();

    const existing = await this.prisma.bookCategory.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`A category with the name "${trimmedName}" already exists`);
    }

    const category = await this.prisma.bookCategory.create({
      data: {
        name: trimmedName,
        description: dto.description?.trim() || null,
        isActive: true,
      },
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'CREATE_CATEGORY',
      module: 'LIBRARY',
      entityId: category.id,
      details: { name: category.name },
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateBookCategoryDto, actorUserId: string) {
    const category = await this.prisma.bookCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Book category not found for ID "${id}"`);
    }

    const data: any = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Category name cannot be empty');
      }

      const duplicate = await this.prisma.bookCategory.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(`Another category with the name "${trimmedName}" already exists`);
      }

      data.name = trimmedName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const updated = await this.prisma.bookCategory.update({
      where: { id },
      data,
      include: {
        _count: { select: { books: true } },
      },
    });

    // If name changed, also update legacy category string on linked books for consistency
    if (data.name && data.name !== category.name) {
      await this.prisma.book.updateMany({
        where: { categoryId: id },
        data: { category: data.name },
      });
    }

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'UPDATE_CATEGORY',
      module: 'LIBRARY',
      entityId: id,
      details: { previousName: category.name, updatedName: updated.name },
    });

    return updated;
  }

  async archiveCategory(id: string, actorUserId: string) {
    const category = await this.prisma.bookCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Book category not found for ID "${id}"`);
    }

    const newStatus = !category.isActive;

    const updated = await this.prisma.bookCategory.update({
      where: { id },
      data: { isActive: newStatus },
      include: {
        _count: { select: { books: true } },
      },
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: newStatus ? 'RESTORE_CATEGORY' : 'ARCHIVE_CATEGORY',
      module: 'LIBRARY',
      entityId: id,
      details: { name: category.name, isActive: newStatus },
    });

    return updated;
  }

  async deleteCategory(id: string, actorUserId: string) {
    const category = await this.prisma.bookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { books: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Book category not found for ID "${id}"`);
    }

    if (category._count.books > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it is linked to ${category._count.books} book(s) in the catalogue. Please archive the category instead to preserve historical records.`,
      );
    }

    await this.prisma.bookCategory.delete({ where: { id } });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'DELETE_CATEGORY',
      module: 'LIBRARY',
      entityId: id,
      details: { name: category.name },
    });

    return { message: `Category "${category.name}" successfully deleted.` };
  }

  // ==========================================
  // Book Catalogue
  // ==========================================

  async findAllBooks(query: {
    search?: string;
    category?: string;
    categoryId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    } else if (query.category) {
      where.OR = [
        { category: { equals: query.category, mode: 'insensitive' } },
        { bookCategory: { name: { equals: query.category, mode: 'insensitive' } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const searchConditions = [
        { title: { contains: term, mode: 'insensitive' } },
        { author: { contains: term, mode: 'insensitive' } },
        { isbn: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { rackLocation: { contains: term, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, books] = await Promise.all([
      this.prisma.book.count({ where }),
      this.prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: {
          bookCategory: {
            select: { id: true, name: true, isActive: true },
          },
        },
      }),
    ]);

    return { total, page, limit, books };
  }

  async findOneBook(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        bookCategory: true,
        issues: {
          where: { status: BookIssueStatus.ISSUED },
          include: {
            student: { select: { firstName: true, lastName: true, admissionNo: true } },
            staff: { select: { firstName: true, lastName: true, employeeId: true } },
          },
        },
      },
    });

    if (!book) throw new NotFoundException('Book not found in library catalogue');
    return book;
  }

  async createBook(dto: CreateBookDto, actorUserId: string) {
    // 1. Resolve category
    let categoryRecord: any = null;

    if (dto.categoryId) {
      categoryRecord = await this.prisma.bookCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!categoryRecord) {
        throw new BadRequestException('Selected book category does not exist');
      }
    } else if (dto.category) {
      // Fallback for legacy payload
      categoryRecord = await this.prisma.bookCategory.findFirst({
        where: { name: { equals: dto.category.trim(), mode: 'insensitive' } },
      });
      if (!categoryRecord) {
        categoryRecord = await this.prisma.bookCategory.create({
          data: {
            name: dto.category.trim(),
            description: `${dto.category.trim()} collection`,
            isActive: true,
          },
        });
      }
    } else {
      throw new BadRequestException('A valid book category is required');
    }

    // 2. Barcode handling
    let barcode = dto.barcode?.trim();
    if (!barcode) {
      barcode = `BC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const existingBarcode = await this.prisma.book.findUnique({
      where: { barcode },
    });
    if (existingBarcode) {
      barcode = `BC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 3. Fallbacks for optional metadata
    const author = dto.author?.trim() || 'Institutional / Zustand Library';
    const isbn = dto.isbn?.trim() || `ISBN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const totalCopies = Math.max(1, Number(dto.totalCopies) || 1);

    const book = await this.prisma.book.create({
      data: {
        title: dto.title.trim(),
        categoryId: categoryRecord.id,
        category: categoryRecord.name,
        totalCopies,
        availableCopies: totalCopies,
        rackLocation: dto.rackLocation?.trim() || null,
        barcode,
        author,
        isbn,
        publisher: dto.publisher?.trim() || null,
        status: 'ACTIVE',
      },
      include: {
        bookCategory: true,
      },
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'ADD_BOOK',
      module: 'LIBRARY',
      entityId: book.id,
      details: { title: book.title, category: categoryRecord.name, totalCopies },
    });

    return book;
  }

  async updateBook(id: string, dto: UpdateBookDto, actorUserId: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found in catalogue');

    const data: any = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.rackLocation !== undefined) data.rackLocation = dto.rackLocation?.trim() || null;
    if (dto.author !== undefined) data.author = dto.author?.trim() || book.author;
    if (dto.publisher !== undefined) data.publisher = dto.publisher?.trim() || null;
    if (dto.isbn !== undefined) data.isbn = dto.isbn?.trim() || book.isbn;

    if (dto.categoryId !== undefined && dto.categoryId) {
      const categoryRecord = await this.prisma.bookCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!categoryRecord) {
        throw new BadRequestException('Selected book category does not exist');
      }
      data.categoryId = categoryRecord.id;
      data.category = categoryRecord.name;
    } else if (dto.category !== undefined && dto.category) {
      data.category = dto.category.trim();
    }

    if (dto.totalCopies !== undefined) {
      const newTotal = Math.max(1, Number(dto.totalCopies));
      const difference = newTotal - book.totalCopies;
      const newAvailable = Math.max(0, book.availableCopies + difference);
      data.totalCopies = newTotal;
      data.availableCopies = newAvailable;
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data,
      include: {
        bookCategory: true,
      },
    });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'UPDATE_BOOK',
      module: 'LIBRARY',
      entityId: id,
      details: { title: updated.title },
    });

    return updated;
  }

  async deleteBook(id: string, actorUserId: string) {
    const activeIssues = await this.prisma.bookIssue.count({
      where: { bookId: id, status: BookIssueStatus.ISSUED },
    });
    if (activeIssues > 0) {
      throw new BadRequestException(
        'Cannot delete book with active issued copies. Please return all issued copies first.',
      );
    }

    // Check if book has historical issues
    const totalIssues = await this.prisma.bookIssue.count({
      where: { bookId: id },
    });

    if (totalIssues > 0) {
      // Soft-archive to preserve historical issue records
      await this.prisma.book.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      await this.auditLogsService.log({
        userId: actorUserId,
        action: 'ARCHIVE_BOOK',
        module: 'LIBRARY',
        entityId: id,
      });

      return { message: 'Book title safely archived to preserve historical issue logs' };
    }

    // If completely new with 0 issue history, hard delete is safe
    await this.prisma.book.delete({ where: { id } });

    await this.auditLogsService.log({
      userId: actorUserId,
      action: 'DELETE_BOOK',
      module: 'LIBRARY',
      entityId: id,
    });

    return { message: 'Book title successfully removed from library catalogue' };
  }

  // ==========================================
  // Circulation Desk (Issue & Return Workflows)
  // PRESERVED STRICTLY AS BEFORE
  // ==========================================

  async issueBook(dto: IssueBookDto, librarianUserId: string) {
    let book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
    if (!book) {
      book = await this.prisma.book.findUnique({ where: { barcode: dto.bookId } });
    }
    if (!book) {
      throw new NotFoundException(`Book not found for identifier "${dto.bookId}"`);
    }

    if (book.availableCopies <= 0) {
      throw new BadRequestException(`No available copies left for "${book.title}". All copies are currently issued.`);
    }

    if (!dto.studentId && !dto.staffId) {
      throw new BadRequestException('A borrower (either studentId or staffId) must be specified');
    }

    let resolvedStudentId = dto.studentId;
    if (dto.studentId) {
      let s = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
      if (!s) {
        s = await this.prisma.student.findUnique({ where: { admissionNo: dto.studentId } });
      }
      if (s) resolvedStudentId = s.id;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dto.loanDays);

    return this.prisma.$transaction(async (tx) => {
      // Decrement available copies
      await tx.book.update({
        where: { id: book.id },
        data: { availableCopies: { decrement: 1 } },
      });

      const issue = await tx.bookIssue.create({
        data: {
          bookId: book.id,
          studentId: resolvedStudentId || null,
          staffId: dto.staffId || null,
          dueDate,
          issuedById: librarianUserId,
          status: BookIssueStatus.ISSUED,
        },
        include: {
          book: true,
          student: { include: { class: true, section: true } },
          staff: true,
        },
      });

      await this.auditLogsService.log({
        userId: librarianUserId,
        action: 'ISSUE_BOOK',
        module: 'LIBRARY',
        entityId: issue.id,
        details: { bookTitle: book.title, dueDate },
      });

      return issue;
    });
  }

  async returnBook(issueId: string, dto: ReturnBookDto, librarianUserId: string) {
    const issue = await this.prisma.bookIssue.findUnique({
      where: { id: issueId },
      include: { book: true },
    });

    if (!issue) {
      throw new NotFoundException('Book issue transaction not found');
    }

    if (issue.status === BookIssueStatus.RETURNED) {
      throw new BadRequestException('This book has already been returned');
    }

    return this.prisma.$transaction(async (tx) => {
      // Increment available copies
      await tx.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });

      const returned = await tx.bookIssue.update({
        where: { id: issueId },
        data: {
          returnedAt: new Date(),
          status: BookIssueStatus.RETURNED,
          fineAmount: dto.fineAmount ?? 0,
          finePaid: dto.finePaid ?? false,
          remarks: dto.remarks || null,
        },
      });

      await this.auditLogsService.log({
        userId: librarianUserId,
        action: 'RETURN_BOOK',
        module: 'LIBRARY',
        entityId: issueId,
        details: { bookTitle: issue.book.title, fineAmount: dto.fineAmount },
      });

      return returned;
    });
  }

  async getOverdueList(limit = 20) {
    const now = new Date();
    return this.prisma.bookIssue.findMany({
      where: {
        status: BookIssueStatus.ISSUED,
        dueDate: { lt: now },
      },
      take: limit,
      orderBy: { dueDate: 'asc' },
      include: {
        book: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
            parent: { select: { fatherName: true, primaryPhone: true } },
          },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, phone: true },
        },
      },
    });
  }

  async getCirculationList(status?: BookIssueStatus, limit = 20) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.bookIssue.findMany({
      where,
      take: limit,
      orderBy: { issuedAt: 'desc' },
      include: {
        book: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        staff: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
      },
    });
  }
}
