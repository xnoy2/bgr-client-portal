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
            $table->string('ghl_submission_id')->nullable()->unique()->after('id');
            $table->string('source')->default('portal')->after('ghl_submission_id');
        });
    }

    public function down(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->dropUnique(['ghl_submission_id']);
            $table->dropColumn(['ghl_submission_id', 'source']);
        });
    }
};
