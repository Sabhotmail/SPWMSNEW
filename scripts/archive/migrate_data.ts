import { Client } from 'pg';

async function main() {
    const oldClient = new Client({ user: 'postgres', host: '192.168.10.15', password: 'S1r1Pr0', port: 5432, database: 'siripro-stock', connectionTimeoutMillis: 10000 });
    const newClient = new Client({ user: 'postgres', host: '127.0.0.1', password: 'S1r1Pr0', port: 5432, database: 'spwms_new', connectionTimeoutMillis: 10000 });

    try {
        await oldClient.connect();
        await newClient.connect();

        console.log('Migration Started.');

        // 1. CLEAR NEW DB
        console.log('Clearing new database...');
        const clearOrder = [
            'stock_logs', 'baskets', 'transaction_details',
            'transaction_headers', 'stock_dates', 'stocks', 'product_uoms',
            'products', 'locations', 'document_numbers',
            'warehouses', 'document_types', 'movement_types', 'brands', 'principals', 'uoms', 'branches', 'users'
        ];
        for (const table of clearOrder) {
            await newClient.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        }

        // 2. HELPERS
        async function migrateChunked(oldTable: string, newTable: string, mapping: { [key: string]: string }, options?: { transform?: (row: any, index: number) => any, onConflict?: string, orderBy?: string }) {
            console.log(`Migrating ${oldTable} -> ${newTable}...`);
            let offset = 0;
            const limit = 5000;
            let total = 0;
            const columns = Object.values(mapping);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            let query = `INSERT INTO "${newTable}" (${columns.join(', ')}) VALUES (${placeholders})`;
            if (options?.onConflict) query += ` ON CONFLICT ${options.onConflict}`;

            while (true) {
                const orderClause = options?.orderBy ? `ORDER BY ${options.orderBy}` : 'ORDER BY id';
                const res = await oldClient.query(`SELECT * FROM "${oldTable}" ${orderClause} LIMIT ${limit} OFFSET ${offset}`);
                if (res.rows.length === 0) break;
                for (const row of res.rows) {
                    const transformed = options?.transform ? options.transform(row, total + 1) : row;
                    const values = Object.keys(mapping).map(oldKey => {
                        let val = transformed[oldKey];
                        if (typeof val === 'string') {
                            val = val.trim();
                            if (val === '') return null;
                        }
                        return val;
                    });
                    try {
                        await newClient.query(query, values);
                    } catch (e: any) {
                        console.error(`!!! Error in ${newTable}: ${e.message}`);
                        // If it's a FK violation, we might want to skip it for analysis? No, let's just log and fail for now.
                        throw e;
                    }
                }
                total += res.rows.length;
                offset += limit;
                console.log(`  Processed ${total} rows...`);
            }
        }

        // 3. RUN

        await migrateChunked('users', 'users', { userid: 'user_id', username: 'username', password: 'password', email: 'email', role: 'role', branch: 'branch_code', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { transform: (row) => ({ ...row, branch: row.branch || 'HQ' }), onConflict: '(user_id) DO NOTHING' });
        await migrateChunked('branches', 'branches', { branchcode: 'branch_code', branchname: 'branch_name', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(branch_code) DO NOTHING' });
        await migrateChunked('principals', 'principals', { principalcode: 'principal_code', principalname: 'principal_name', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(principal_code) DO NOTHING' });
        await migrateChunked('movementtypes', 'movement_types', { movementtypecode: 'movement_type_code', movementtypename: 'movement_type_name', direction: 'direction', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { transform: (row) => ({ ...row, direction: row.stocksign === 1 ? 'IN' : 'OUT' }), onConflict: '(movement_type_code) DO NOTHING' });
        await migrateChunked('documenttypes', 'document_types', { doctypecode: 'doc_type_code', doctypename: 'doc_type_name', movementgroup: 'movement_type', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(doc_type_code) DO NOTHING' });
        await migrateChunked('uoms', 'uoms', { uomcode: 'uom_code', uomname: 'uom_name', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(uom_code) DO NOTHING' });
        await migrateChunked('warehouses', 'warehouses', { whcode: 'wh_code', whname: 'wh_name', branch_code: 'branch_code', palletcapacity: 'pallet_capacity', casecapacity: 'case_capacity', seq: 'seq', status: 'status', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' }, { transform: (row) => ({ ...row, branch_code: 'HQ' }), onConflict: '(wh_code) DO NOTHING' });
        await migrateChunked('locations', 'locations', { whcode: 'wh_code', loccode: 'loc_code', locname: 'loc_name', status: 'status', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(wh_code, loc_code) DO NOTHING' });
        await migrateChunked('brands', 'brands', { brandcode: 'brand_code', brandname: 'brand_name', status: 'status', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(brand_code) DO NOTHING' });
        await migrateChunked('products', 'products', { productcode: 'product_code', productname: 'product_name', principalproductcode: 'principal_product_code', piecebarcode: 'piece_barcode', packbarcode: 'pack_barcode', innerbarcode: 'inner_barcode', casebarcode: 'case_barcode', imgpath: 'img_path', shelflife: 'shelf_life', reorderpoint: 'reorder_point', slowmovingday: 'slow_moving_day', mediummovingday: 'medium_moving_day', fastmovingday: 'fast_moving_day', allowpartialin: 'allow_partial_in', allowpartialout: 'allow_partial_out', brandcode: 'brand_code', status: 'status', principalcode: 'principal_code', caseweight: 'case_weight', casewidth: 'case_width', caselength: 'case_length', caseheight: 'case_height', casevolume: 'case_volume', stockcontrol: 'stock_control', maxmfgdays: 'max_mfg_days', allowmaxmfgdays: 'allow_max_mfg_days', offsetdays: 'offset_days', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(product_code) DO NOTHING' });
        await newClient.query('UPDATE products SET base_uom_code = \'PCS\' WHERE base_uom_code IS NULL');
        await migrateChunked('productuoms', 'product_uoms', { productcode: 'product_code', uomcode: 'uom_code', startdate: 'start_date', enddate: 'end_date', uomratio: 'uom_ratio', status: 'status', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(product_code, uom_code) DO NOTHING' });

        await migrateChunked('transaction_headers', 'transaction_headers', {
            docno: 'doc_no', docdate: 'doc_date', postdate: 'post_date', doctypecode: 'doc_type_code',
            whcode: 'wh_code', loccode: 'loc_code', salesmancode: 'salesman_code', ref1: 'ref1',
            ref2: 'ref2', ref3: 'ref3', movementtypecode: 'movement_type_code', remark: 'remark',
            docstate: 'doc_state', status: 'doc_status', createduserid: 'created_by',
            updateduserid: 'updated_by', createdusername: 'created_user_name',
            updatedusername: 'updated_user_name', towhcode: 'to_wh_code',
            created_at: 'created_at', updated_at: 'updated_at'
        }, { onConflict: '(doc_no) DO NOTHING' });

        const lineCountMap = new Map<string, number>();
        await migrateChunked('transaction_details', 'transaction_details', {
            docno: 'doc_no', productcode: 'product_code', uomcode: 'uom_code', uomqty: 'uom_qty',
            pieceqty: 'piece_qty', uomratio: 'uom_ratio', qty: 'qty', whcode: 'wh_code',
            loccode: 'loc_code', movementtypecode: 'movement_type_code', docstate: 'doc_state',
            mfgdate: 'mfg_date', expdate: 'exp_date', recordtype: 'record_type', remark: 'remark',
            status: 'status', createduserid: 'created_user_id', updateduserid: 'updated_user_id',
            createdusername: 'created_user_name', updatedusername: 'updated_user_name',
            created_at: 'created_at', updated_at: 'updated_at', line_no: 'line_no'
        }, {
            transform: (row) => {
                const docNo = (row.docno || '').trim();
                const currentLine = (lineCountMap.get(docNo) || 0) + 1;
                lineCountMap.set(docNo, currentLine);
                return { ...row, line_no: currentLine };
            },
            onConflict: '(doc_no, line_no) DO NOTHING'
        });

        await migrateChunked('stocks', 'stocks', { productcode: 'product_code', whcode: 'wh_code', loccode: 'loc_code', balance: 'balance', futureinbal: 'future_in_bal', futureoutbal: 'future_out_bal', qty: 'qty', firstindate: 'first_in_date', lastindate: 'last_in_date', firstoutdate: 'first_out_date', lastoutdate: 'last_out_date', lastmovedate: 'last_move_date', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(product_code, wh_code, loc_code) DO NOTHING' });
        await migrateChunked('stockdates', 'stock_dates', { productcode: 'product_code', whcode: 'wh_code', loccode: 'loc_code', mfgdate: 'mfg_date', expdate: 'exp_date', balance: 'balance', futureinbal: 'future_in_bal', futureoutbal: 'future_out_bal', qty: 'qty', stockdate: 'stock_date', firstindate: 'first_in_date', lastindate: 'last_in_date', firstoutdate: 'first_out_date', lastoutdate: 'last_out_date', lastmovedate: 'last_move_date', createduserid: 'created_user_id', updateduserid: 'updated_user_id', created_at: 'created_at', updated_at: 'updated_at' });
        await migrateChunked('stocklogs', 'stock_logs', { productcode: 'product_code', whcode: 'wh_code', loccode: 'loc_code', docno: 'doc_no', doctypecode: 'doc_type_code', movementtypecode: 'movement_type_code', qty: 'qty', balance: 'balance', remark: 'remark', createduserid: 'created_user_id', created_at: 'created_at' });
        await migrateChunked('documentnumbers', 'document_numbers', { doctypecode: 'doc_type_code', year: 'year', lastnumber: 'last_number', created_at: 'created_at', updated_at: 'updated_at' }, { onConflict: '(doc_type_code, year) DO NOTHING' });

        console.log('Resetting sequences...');
        const tablesToReset = ['users', 'branches', 'principals', 'movement_types', 'document_types', 'uoms', 'warehouses', 'locations', 'brands', 'products', 'product_uoms', 'transaction_headers', 'transaction_details', 'stocks', 'stock_dates', 'stock_logs', 'document_numbers'];
        for (const table of tablesToReset) { await newClient.query(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "${table}"`); }
        console.log('Migration Completed Successfully! 🎉');
    } catch (err: any) {
        console.error('Migration Failed:', err.message);
        process.exit(1);
    } finally { await oldClient.end(); await newClient.end(); }
}
main();
