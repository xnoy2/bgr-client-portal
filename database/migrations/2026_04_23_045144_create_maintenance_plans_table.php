<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('price');
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        // Seed default plans
        $now = now();
        DB::table('maintenance_plans')->insert([
            [
                'name'       => 'Essential',
                'slug'       => 'essential',
                'price'      => 299,
                'is_popular' => false,
                'is_active'  => true,
                'sort_order' => 1,
                'features'   => json_encode(['Annual inspection', 'Roof & gutter check', 'Priority booking']),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Premium',
                'slug'       => 'premium',
                'price'      => 549,
                'is_popular' => true,
                'is_active'  => true,
                'sort_order' => 2,
                'features'   => json_encode(['2 inspection visits', 'Exterior repaint', 'Roof & gutter check', 'Priority booking']),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Elite',
                'slug'       => 'elite',
                'price'      => 899,
                'is_popular' => false,
                'is_active'  => true,
                'sort_order' => 3,
                'features'   => json_encode(['Quarterly visits', 'Full exterior repaint', 'Window & door service', '24hr response SLA']),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_plans');
    }
};
