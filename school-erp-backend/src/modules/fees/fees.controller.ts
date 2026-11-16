import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from './fees.service';
import { RecordFeePaymentDto, ReversePaymentDto, CreateFeeStructureDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Fee Management (Manual Only)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('heads')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List all standard fee heads' })
  async getFeeHeads() {
    return this.feesService.getFeeHeads();
  }

  @Get('structures')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get class-wise fee structures' })
  async getFeeStructures(
    @Query('sessionId') sessionId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.feesService.getFeeStructures(sessionId, classId);
  }

  @Post('structures')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Configure class fee structure for an academic session' })
  async createFeeStructure(@Body() dto: CreateFeeStructureDto) {
    return this.feesService.createFeeStructure(dto);
  }

  @Get('student/:studentId')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT, Role.TEACHER, Role.PARENT, Role.STUDENT)
  @ApiOperation({ summary: 'Get student fee ledger and complete payment receipts history' })
  async getStudentFeeLedger(@Param('studentId') studentId: string) {
    return this.feesService.getStudentFeeLedger(studentId);
  }

  @Post('collect')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Record manual fee receipt (Cash/UPI/Bank/Cheque only - Admin & Accountant)' })
  async recordPayment(
    @Body() dto: RecordFeePaymentDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.feesService.recordPayment(dto, actorUserId);
  }

  @Put('payments/:paymentId/reverse')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Audited reversal/refund of a recorded fee payment receipt' })
  async reversePayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ReversePaymentDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.feesService.reversePayment(paymentId, dto, actorUserId);
  }

  @Get('defaulters')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'List fee defaulters with pending dues' })
  async getDefaulters(@Query('classId') classId?: string) {
    return this.feesService.getDefaulters(classId);
  }

  @Get('recent-receipts')
  @Roles(Role.SCHOOL_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get latest recorded payment receipts ledger' })
  async getRecentReceipts(@Query('limit') limit?: number) {
    return this.feesService.getRecentReceipts(limit ? Number(limit) : 10);
  }
}

