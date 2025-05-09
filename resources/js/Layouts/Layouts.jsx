import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

export default function Layout({ children }) {
    const { props } = usePage();

    useEffect(() => {
        if (props.flash?.success) {
            Swal.fire({
                title: props.flash.success,
                icon: 'success',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }

        if (props.flash?.error) {
            Swal.fire({
                title: props.flash.error,
                icon: 'error',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }
    }, [props.flash]);

    return (
        <>
            <Header />
            <main className="p-4">{children}</main>
            <Footer />
        </>
    );
}
