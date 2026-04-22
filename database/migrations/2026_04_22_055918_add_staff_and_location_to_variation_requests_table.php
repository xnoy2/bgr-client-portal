<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->string('staff_member')->nullable()->after('title');
            $table->string('site_location')->nullable()->after('staff_member');
        });
    }

    public function down(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->dropColumn(['staff_member', 'site_location']);
        });
    }
};
