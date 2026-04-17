<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedBigInteger('docuseal_template_id')->nullable()->after('ghl_file_id');
            $table->unsignedBigInteger('docuseal_submission_id')->nullable()->after('docuseal_template_id');
            $table->string('docuseal_slug')->nullable()->after('docuseal_submission_id');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['docuseal_template_id', 'docuseal_submission_id', 'docuseal_slug']);
        });
    }
};
