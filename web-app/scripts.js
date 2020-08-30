window.chartColors = {
    red: 'rgba(222, 66, 91, 1)',
    orange: 'rgba(255, 159, 64, 1)',
    yellow: 'rgba(255, 236, 152, 1)',
    green: 'rgba(72, 143, 49, 1)',
    blue: 'rgba(54, 162, 235, 1)',
    purple: 'rgba(153, 102, 255, 1)',
    grey: 'rgba(201, 203, 207, 1)',
};
window.chartColorsSemi = {
    red: 'rgba(222, 66, 91, 0.6)',
    orange: 'rgba(255, 159, 64, 0.6)',
    yellow: 'rgba(255, 236, 152, 0.6)',
    green: 'rgba(72, 143, 49, 0.6)',
    blue: 'rgba(54, 162, 235, 0.6)',
    purple: 'rgba(153, 102, 255, 0.6)',
    grey: 'rgba(201, 203, 207, 0.6)',
};

function defer(method) {
    if (window.jQuery) {
        method();
    } else {
        setTimeout(function() { defer(method) }, 50);
    }
}

function config_value_changed(el) {
    let $el = $(el);
    let name = $el.attr('name');
    let new_value = $el.val();

    if ($('[name="' + name + '_suffix"]').length > 0) {
        let $el2 = $('[name="' + name + '_suffix"]');
        new_value = new_value + $el2.val();
    } else if (name.indexOf('_suffix') > -1) {
        name = name.substr(0, name.length-7);
        let $el2 = $('[name="' + name + '"]');
        new_value = $el2.val() + new_value;
    }

    if (name.indexOf('drive_selection_algorithm') === 0) {
        name = 'drive_selection_algorithm';
        new_value = get_forced_groups_config();
    }

    console.log(name + " = " + new_value);

    // @TODO Save the new value!

    $el.attr('data-toggle', 'tooltip').attr('data-placement', 'bottom').attr('title', 'New value saved').tooltip({trigger: 'manual'}).tooltip('show');
    setTimeout(function() { $el.tooltip('hide'); }, 2*1000);
}

function get_forced_groups_config() {
    if ($('[name="drive_selection_algorithm_forced"]:checked').val() === 'no') {
        $('.forced_toggleable').closest('.form-group').hide();
        return $('[name="drive_selection_algorithm"]:checked').val();
    }
    $('.forced_toggleable').closest('.form-group').show();
    let groups = [];
    for (let i=0; i<100; i++) {
        let num = $('[name="drive_selection_algorithm_forced['+i+'][num]"]').val();
        let group = $('[name="drive_selection_algorithm_forced['+i+'][group]"]').val();
        if (typeof num !== 'undefined' && num !== '' && typeof group !== 'undefined' && group !== '') {
            if (num !== 'all') {
                num += 'x';
            } else {
                num += ' ';
            }
            groups.push(num + group);
        }
    }

    return 'forced (' + groups.join(', ') + ') ' + $('[name="drive_selection_algorithm"]:checked').val();
}
defer(function(){ get_forced_groups_config(); });

function bytes_to_human(bytes) {
    let units = 'B';
    if (Math.abs(bytes) > 1024) {
        bytes /= 1024;
        units = 'KB';
    }
    if (Math.abs(bytes) > 1024) {
        bytes /= 1024;
        units = 'MB';
    }
    if (Math.abs(bytes) > 1024) {
        bytes /= 1024;
        units = 'GB';
    }
    if (Math.abs(bytes) > 1024) {
        bytes /= 1024;
        units = 'TB';
    }
    let decimals = (Math.abs(bytes) > 100 ? 0 : (Math.abs(bytes) > 10 ? 1 : 2));
    return parseFloat(bytes).toFixed(decimals) + units;
}

function drawPieChartStorage(ctx, stats) {
    let dataset_used = [];
    let dataset_trash = [];
    let dataset_free = [];
    let drives = [];
    for (let sp_drive in stats) {
        let stat = stats[sp_drive];
        if (sp_drive === 'Total') {
            continue;
        }
        drives.push(sp_drive);
        dataset_used.push(stat.used_space);
        dataset_trash.push(stat.trash_size);
        dataset_free.push(stat.free_space);
    }
    let dataset_all_drives = dataset_used.concat(dataset_trash).concat(dataset_free);
    let labels_all_drives = [];
    let colors_all_drives = [];
    for (let i in dataset_used) {
        let v = dataset_used[i];
        labels_all_drives.push(drives[i] + " Used: " + bytes_to_human(v * 1024));
        colors_all_drives.push(window.chartColorsSemi.red);
    }
    for (let i in dataset_trash) {
        let v = dataset_trash[i];
        labels_all_drives.push(drives[i] + " Trash: " + bytes_to_human(v * 1024));
        colors_all_drives.push(window.chartColorsSemi.yellow);
    }
    for (let i in dataset_free) {
        let v = dataset_free[i];
        labels_all_drives.push(drives[i] + " Free: " + bytes_to_human(v * 1024));
        colors_all_drives.push(window.chartColorsSemi.green);
    }

    let stat = stats['Total'];
    let total = stat.used_space + stat.trash_size + stat.free_space;
    let labels_summary = [
        'Used: ' + bytes_to_human(stat.used_space * 1024),
        'Trash: ' + bytes_to_human(stat.trash_size * 1024),
        'Free: ' + bytes_to_human(stat.free_space * 1024)
    ];
    new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [
                {
                    // "Sum" dataset needs to appear first, for Leged to appear correctly
                    weight: 0,
                    data: [stat.used_space, stat.trash_size, stat.free_space],
                    backgroundColor: [
                        window.chartColors.red,
                        window.chartColors.yellow,
                        window.chartColors.green
                    ],
                    labels: labels_summary,
                },
                {
                    weight: 50,
                    data: dataset_all_drives,
                    backgroundColor: colors_all_drives,
                    labels: labels_all_drives
                },
                {
                    weight: 50,
                    data: [stat.used_space, stat.trash_size, stat.free_space],
                    backgroundColor: [
                        window.chartColors.red,
                        window.chartColors.yellow,
                        window.chartColors.green
                    ],
                    labels: labels_summary,
                },
            ],
            labels: labels_summary
        },
        options: {
            cutoutPercentage: 20,
            responsive: true,
            responsiveAnimationDuration: 400,
            legend: {
                position: 'right',
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].labels[tooltipItem.index] || '';
                        if (label) {
                            label += ' = ';
                        }
                        let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        var percentage = Math.round(value / total * 100);
                        label += percentage + "%";
                        return label;
                    }
                }
            }
        }
    });
}

function drawPieChartDiskUsage(ctx, du_stats) {
    let dataset = [];
    let labels = [];
    let colors = [];
    let avail_colors = ['#003f5c','#58508d','#bc5090','#ff6361','#ffa600'];
    for (let i in du_stats) {
        let row = du_stats[i];
        dataset.push(parseFloat(row.size));
        labels.push(row.file_path + ": " + bytes_to_human(row.size));
        colors.push(avail_colors[i % avail_colors.length]);
    }

    new Chart(ctx, {
        type: 'pie',
        data: {
            datasets: [
                {
                    data: dataset,
                    backgroundColor: colors,
                },
            ],
            labels: labels
        },
        options: {
            cutoutPercentage: 20,
            responsive: true,
            responsiveAnimationDuration: 400,
            legend: {
                position: 'right',
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return data.labels[tooltipItem.index];
                    }
                }
            }
        }
    });
}
