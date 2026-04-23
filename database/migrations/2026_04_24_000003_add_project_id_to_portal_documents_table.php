<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portal_documents', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('portal_documents', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropColumn('project_id');
        });
    }
};
