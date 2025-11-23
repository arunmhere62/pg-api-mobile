import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { defaultPermissions } from './seeds/default-permissions';

@Injectable()
export class PermissionsSeedService {
  constructor(private prisma: PrismaService) {}

  /**
   * Seed default permissions
   */
  async seedDefaultPermissions() {
    try {
      console.log('🌱 Seeding default permissions...');

      // Get existing permissions
      const existingPermissions = await this.prisma.permissions_master.findMany({
        select: { screen_name: true, action: true },
      });

      const existingKeys = existingPermissions.map(p => `${p.screen_name}_${p.action.toLowerCase()}`);

      // Filter out permissions that already exist
      const newPermissions = defaultPermissions.filter(
        permission => !existingKeys.includes(`${permission.screen_name}_${permission.action.toLowerCase()}`)
      );

      if (newPermissions.length === 0) {
        console.log('✅ All default permissions already exist');
        return {
          success: true,
          message: 'All default permissions already exist',
          data: { existing: existingKeys.length, created: 0 },
        };
      }

      // Create new permissions
      const result = await this.prisma.permissions_master.createMany({
        data: newPermissions.map(p => ({
          screen_name: p.screen_name,
          action: p.action as any, // Cast to Prisma enum
          description: p.description,
        })),
        skipDuplicates: true,
      });

      console.log(`✅ Created ${result.count} new permissions`);

      return {
        success: true,
        message: `Successfully seeded ${result.count} permissions`,
        data: {
          existing: existingKeys.length,
          created: result.count,
          total: existingKeys.length + result.count,
        },
      };
    } catch (error) {
      console.error('❌ Error seeding permissions:', error);
      throw error;
    }
  }

  /**
   * Create default roles with permissions
   */
  async createDefaultRoles() {
    try {
      console.log('🌱 Creating default roles...');

      // Get all permissions
      const allPermissions = await this.prisma.permissions_master.findMany();
      const permissionMap = allPermissions.reduce((acc, permission) => {
        const permissionKey = `${permission.screen_name}_${permission.action.toLowerCase()}`;
        acc[permissionKey] = true;
        return acc;
      }, {} as Record<string, boolean>);

      // Define default roles
      const defaultRoles = [
        {
          role_name: 'Super Admin',
          permissions: permissionMap, // All permissions
        },
        {
          role_name: 'Admin',
          permissions: {
            // PG Location permissions
            pg_location_create: true,
            pg_location_edit: true,
            pg_location_view: true,
            // Room permissions
            room_create: true,
            room_edit: true,
            room_delete: true,
            room_view: true,
            // Bed permissions
            bed_create: true,
            bed_edit: true,
            bed_delete: true,
            bed_view: true,
            // Tenant permissions
            tenant_create: true,
            tenant_edit: true,
            tenant_view: true,
            // Payment permissions
            rent_create: true,
            rent_edit: true,
            rent_view: true,
            advance_create: true,
            advance_edit: true,
            advance_view: true,
            refund_create: true,
            refund_edit: true,
            refund_view: true,
            // Expense permissions
            expense_create: true,
            expense_edit: true,
            expense_view: true,
            // Employee permissions
            employee_create: true,
            employee_edit: true,
            employee_view: true,
            employee_salary_create: true,
            employee_salary_edit: true,
            employee_salary_view: true,
            // Reports
            reports_view: true,
            reports_export: true,
            // Notifications
            notification_send: true,
            notification_view: true,
          },
        },
        {
          role_name: 'Manager',
          permissions: {
            // View permissions for most entities
            pg_location_view: true,
            room_view: true,
            bed_view: true,
            tenant_view: true,
            tenant_create: true,
            tenant_edit: true,
            // Payment permissions
            rent_create: true,
            rent_edit: true,
            rent_view: true,
            advance_view: true,
            refund_view: true,
            // Visitor permissions
            visitor_create: true,
            visitor_edit: true,
            visitor_view: true,
            // Basic expense view
            expense_view: true,
            // Reports
            reports_view: true,
            // Notifications
            notification_view: true,
          },
        },
        {
          role_name: 'Staff',
          permissions: {
            // Basic view permissions
            pg_location_view: true,
            room_view: true,
            bed_view: true,
            tenant_view: true,
            // Visitor management
            visitor_create: true,
            visitor_edit: true,
            visitor_view: true,
            // Basic payment view
            rent_view: true,
            advance_view: true,
            // Notifications
            notification_view: true,
          },
        },
        {
          role_name: 'Viewer',
          permissions: {
            // Only view permissions
            pg_location_view: true,
            room_view: true,
            bed_view: true,
            tenant_view: true,
            rent_view: true,
            advance_view: true,
            expense_view: true,
            reports_view: true,
            notification_view: true,
          },
        },
      ];

      // Check which roles already exist
      const existingRoles = await this.prisma.roles.findMany({
        where: {
          role_name: {
            in: defaultRoles.map(role => role.role_name),
          },
          is_deleted: false,
        },
        select: { role_name: true },
      });

      const existingRoleNames = existingRoles.map(role => role.role_name);
      const newRoles = defaultRoles.filter(role => !existingRoleNames.includes(role.role_name));

      if (newRoles.length === 0) {
        console.log('✅ All default roles already exist for this organization');
        return {
          success: true,
          message: 'All default roles already exist for this organization',
          data: { existing: existingRoleNames.length, created: 0 },
        };
      }

      // Create new roles
      const createdRoles = await Promise.all(
        newRoles.map(role =>
          this.prisma.roles.create({
            data: role,
            select: {
              s_no: true,
              role_name: true,
            },
          })
        )
      );

      console.log(`✅ Created ${createdRoles.length} new roles`);

      return {
        success: true,
        message: `Successfully created ${createdRoles.length} default roles`,
        data: {
          existing: existingRoleNames.length,
          created: createdRoles.length,
          roles: createdRoles,
        },
      };
    } catch (error) {
      console.error('❌ Error creating default roles:', error);
      throw error;
    }
  }
}
